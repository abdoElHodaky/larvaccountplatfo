<?php

namespace Modules\Accounting\Services;

use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Models\Transaction;
use Modules\Shared\Models\Organization;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;

class DoubleEntryService
{
    /**
     * Create a journal entry with transactions
     */
    public function createJournalEntry(Organization $organization, array $entryData, array $transactions): JournalEntry
    {
        DB::beginTransaction();

        try {
            // Validate entry data
            $this->validateJournalEntryData($entryData);

            // Validate transactions
            $this->validateTransactions($transactions);

            // Create journal entry
            $entryData['organization_id'] = $organization->id;
            $entryData['currency'] = $entryData['currency'] ?? $organization->currency;
            $entryData['created_by'] = $entryData['created_by'] ?? auth()->id();

            $journalEntry = JournalEntry::create($entryData);

            // Create transactions
            $totalDebits = 0;
            $totalCredits = 0;

            foreach ($transactions as $transactionData) {
                $transaction = $this->createTransaction($journalEntry, $transactionData);
                
                $totalDebits += $transaction->debit_amount;
                $totalCredits += $transaction->credit_amount;
            }

            // Update journal entry totals
            $journalEntry->update([
                'total_debits' => $totalDebits,
                'total_credits' => $totalCredits,
            ]);

            // Validate that entry is balanced
            if (!$journalEntry->isBalanced()) {
                throw new \Exception('Journal entry is not balanced. Total debits must equal total credits.');
            }

            DB::commit();

            return $journalEntry->load('transactions.account');
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Create a single transaction
     */
    protected function createTransaction(JournalEntry $journalEntry, array $transactionData): Transaction
    {
        // Validate account exists and is active
        $account = Account::where('organization_id', $journalEntry->organization_id)
            ->where('id', $transactionData['account_id'])
            ->where('is_active', true)
            ->first();

        if (!$account) {
            throw new \Exception('Account not found or inactive: ' . $transactionData['account_id']);
        }

        // Ensure only debit OR credit amount is provided
        $hasDebit = !empty($transactionData['debit_amount']) && $transactionData['debit_amount'] > 0;
        $hasCredit = !empty($transactionData['credit_amount']) && $transactionData['credit_amount'] > 0;

        if ($hasDebit && $hasCredit) {
            throw new \Exception('Transaction cannot have both debit and credit amounts');
        }

        if (!$hasDebit && !$hasCredit) {
            throw new \Exception('Transaction must have either debit or credit amount');
        }

        // Set transaction data
        $transactionData['journal_entry_id'] = $journalEntry->id;
        $transactionData['organization_id'] = $journalEntry->organization_id;
        $transactionData['transaction_date'] = $journalEntry->entry_date;
        $transactionData['currency'] = $transactionData['currency'] ?? $journalEntry->currency;
        $transactionData['created_by'] = $transactionData['created_by'] ?? $journalEntry->created_by;

        // Set amount field
        $transactionData['amount'] = $hasDebit ? $transactionData['debit_amount'] : $transactionData['credit_amount'];

        // Ensure zero amounts for the opposite side
        $transactionData['debit_amount'] = $hasDebit ? $transactionData['debit_amount'] : 0;
        $transactionData['credit_amount'] = $hasCredit ? $transactionData['credit_amount'] : 0;

        return Transaction::create($transactionData);
    }

    /**
     * Post a journal entry
     */
    public function postJournalEntry(JournalEntry $journalEntry, int $userId = null): bool
    {
        DB::beginTransaction();

        try {
            $result = $journalEntry->post($userId);

            DB::commit();

            return $result;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Reverse a journal entry
     */
    public function reverseJournalEntry(JournalEntry $journalEntry, string $reason = null, int $userId = null): JournalEntry
    {
        DB::beginTransaction();

        try {
            $reversal = $journalEntry->reverse($reason, $userId);

            DB::commit();

            return $reversal;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Create a simple two-account journal entry
     */
    public function createSimpleEntry(
        Organization $organization,
        int $debitAccountId,
        int $creditAccountId,
        float $amount,
        string $description,
        \DateTime $date = null,
        array $additionalData = []
    ): JournalEntry {
        $date = $date ?: now();

        $entryData = array_merge([
            'entry_date' => $date,
            'description' => $description,
        ], $additionalData);

        $transactions = [
            [
                'account_id' => $debitAccountId,
                'debit_amount' => $amount,
                'credit_amount' => 0,
                'description' => $description,
            ],
            [
                'account_id' => $creditAccountId,
                'debit_amount' => 0,
                'credit_amount' => $amount,
                'description' => $description,
            ],
        ];

        return $this->createJournalEntry($organization, $entryData, $transactions);
    }

    /**
     * Create a compound journal entry (multiple debits/credits)
     */
    public function createCompoundEntry(
        Organization $organization,
        array $debits,
        array $credits,
        string $description,
        \DateTime $date = null,
        array $additionalData = []
    ): JournalEntry {
        $date = $date ?: now();

        // Validate that total debits equal total credits
        $totalDebits = array_sum(array_column($debits, 'amount'));
        $totalCredits = array_sum(array_column($credits, 'amount'));

        if (abs($totalDebits - $totalCredits) > 0.01) {
            throw new \Exception('Total debits must equal total credits');
        }

        $entryData = array_merge([
            'entry_date' => $date,
            'description' => $description,
        ], $additionalData);

        $transactions = [];

        // Add debit transactions
        foreach ($debits as $debit) {
            $transactions[] = [
                'account_id' => $debit['account_id'],
                'debit_amount' => $debit['amount'],
                'credit_amount' => 0,
                'description' => $debit['description'] ?? $description,
            ];
        }

        // Add credit transactions
        foreach ($credits as $credit) {
            $transactions[] = [
                'account_id' => $credit['account_id'],
                'debit_amount' => 0,
                'credit_amount' => $credit['amount'],
                'description' => $credit['description'] ?? $description,
            ];
        }

        return $this->createJournalEntry($organization, $entryData, $transactions);
    }

    /**
     * Record a cash receipt
     */
    public function recordCashReceipt(
        Organization $organization,
        int $cashAccountId,
        int $revenueAccountId,
        float $amount,
        string $description,
        \DateTime $date = null
    ): JournalEntry {
        return $this->createSimpleEntry(
            $organization,
            $cashAccountId,    // Debit Cash
            $revenueAccountId, // Credit Revenue
            $amount,
            $description,
            $date
        );
    }

    /**
     * Record a cash payment
     */
    public function recordCashPayment(
        Organization $organization,
        int $expenseAccountId,
        int $cashAccountId,
        float $amount,
        string $description,
        \DateTime $date = null
    ): JournalEntry {
        return $this->createSimpleEntry(
            $organization,
            $expenseAccountId, // Debit Expense
            $cashAccountId,    // Credit Cash
            $amount,
            $description,
            $date
        );
    }

    /**
     * Record a sale on credit
     */
    public function recordCreditSale(
        Organization $organization,
        int $accountsReceivableId,
        int $revenueAccountId,
        float $amount,
        string $description,
        \DateTime $date = null
    ): JournalEntry {
        return $this->createSimpleEntry(
            $organization,
            $accountsReceivableId, // Debit Accounts Receivable
            $revenueAccountId,     // Credit Revenue
            $amount,
            $description,
            $date
        );
    }

    /**
     * Record a purchase on credit
     */
    public function recordCreditPurchase(
        Organization $organization,
        int $expenseAccountId,
        int $accountsPayableId,
        float $amount,
        string $description,
        \DateTime $date = null
    ): JournalEntry {
        return $this->createSimpleEntry(
            $organization,
            $expenseAccountId,   // Debit Expense
            $accountsPayableId,  // Credit Accounts Payable
            $amount,
            $description,
            $date
        );
    }

    /**
     * Record payment of accounts receivable
     */
    public function recordReceivablePayment(
        Organization $organization,
        int $cashAccountId,
        int $accountsReceivableId,
        float $amount,
        string $description,
        \DateTime $date = null
    ): JournalEntry {
        return $this->createSimpleEntry(
            $organization,
            $cashAccountId,        // Debit Cash
            $accountsReceivableId, // Credit Accounts Receivable
            $amount,
            $description,
            $date
        );
    }

    /**
     * Record payment of accounts payable
     */
    public function recordPayablePayment(
        Organization $organization,
        int $accountsPayableId,
        int $cashAccountId,
        float $amount,
        string $description,
        \DateTime $date = null
    ): JournalEntry {
        return $this->createSimpleEntry(
            $organization,
            $accountsPayableId, // Debit Accounts Payable
            $cashAccountId,     // Credit Cash
            $amount,
            $description,
            $date
        );
    }

    /**
     * Record depreciation
     */
    public function recordDepreciation(
        Organization $organization,
        int $depreciationExpenseId,
        int $accumulatedDepreciationId,
        float $amount,
        string $description,
        \DateTime $date = null
    ): JournalEntry {
        return $this->createSimpleEntry(
            $organization,
            $depreciationExpenseId,      // Debit Depreciation Expense
            $accumulatedDepreciationId,  // Credit Accumulated Depreciation
            $amount,
            $description,
            $date
        );
    }

    /**
     * Record accrued expense
     */
    public function recordAccruedExpense(
        Organization $organization,
        int $expenseAccountId,
        int $accruedExpenseId,
        float $amount,
        string $description,
        \DateTime $date = null
    ): JournalEntry {
        return $this->createSimpleEntry(
            $organization,
            $expenseAccountId,  // Debit Expense
            $accruedExpenseId,  // Credit Accrued Expense
            $amount,
            $description,
            $date
        );
    }

    /**
     * Get account ledger
     */
    public function getAccountLedger(
        Account $account,
        \DateTime $startDate = null,
        \DateTime $endDate = null
    ): array {
        $query = $account->transactions()
            ->with(['journalEntry', 'account'])
            ->orderBy('transaction_date')
            ->orderBy('created_at');

        if ($startDate) {
            $query->where('transaction_date', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('transaction_date', '<=', $endDate);
        }

        $transactions = $query->get();
        $runningBalance = $account->opening_balance ?? 0;
        $ledgerEntries = [];

        foreach ($transactions as $transaction) {
            // Calculate running balance
            if ($account->normal_balance === Account::BALANCE_DEBIT) {
                $runningBalance += $transaction->debit_amount - $transaction->credit_amount;
            } else {
                $runningBalance += $transaction->credit_amount - $transaction->debit_amount;
            }

            $ledgerEntries[] = [
                'transaction' => $transaction,
                'running_balance' => $runningBalance,
                'formatted_balance' => number_format($runningBalance, 2) . ' ' . $account->currency,
            ];
        }

        return [
            'account' => $account,
            'entries' => $ledgerEntries,
            'opening_balance' => $account->opening_balance ?? 0,
            'closing_balance' => $runningBalance,
            'start_date' => $startDate,
            'end_date' => $endDate,
        ];
    }

    /**
     * Validate journal entry data
     */
    protected function validateJournalEntryData(array $entryData): void
    {
        if (empty($entryData['entry_date'])) {
            throw new \Exception('Entry date is required');
        }

        if (empty($entryData['description'])) {
            throw new \Exception('Description is required');
        }

        // Validate entry date is not in the future
        $entryDate = is_string($entryData['entry_date']) 
            ? new \DateTime($entryData['entry_date']) 
            : $entryData['entry_date'];

        if ($entryDate > new \DateTime()) {
            throw new \Exception('Entry date cannot be in the future');
        }
    }

    /**
     * Validate transactions array
     */
    protected function validateTransactions(array $transactions): void
    {
        if (empty($transactions)) {
            throw new \Exception('At least one transaction is required');
        }

        if (count($transactions) < 2) {
            throw new \Exception('At least two transactions are required for double-entry bookkeeping');
        }

        $totalDebits = 0;
        $totalCredits = 0;

        foreach ($transactions as $index => $transaction) {
            // Validate required fields
            if (empty($transaction['account_id'])) {
                throw new \Exception("Transaction {$index}: Account ID is required");
            }

            // Validate amounts
            $debitAmount = $transaction['debit_amount'] ?? 0;
            $creditAmount = $transaction['credit_amount'] ?? 0;

            if ($debitAmount < 0 || $creditAmount < 0) {
                throw new \Exception("Transaction {$index}: Amounts cannot be negative");
            }

            if ($debitAmount > 0 && $creditAmount > 0) {
                throw new \Exception("Transaction {$index}: Cannot have both debit and credit amounts");
            }

            if ($debitAmount == 0 && $creditAmount == 0) {
                throw new \Exception("Transaction {$index}: Must have either debit or credit amount");
            }

            $totalDebits += $debitAmount;
            $totalCredits += $creditAmount;
        }

        // Validate that debits equal credits
        if (abs($totalDebits - $totalCredits) > 0.01) {
            throw new \Exception('Total debits must equal total credits');
        }
    }

    /**
     * Get journal entries for an organization
     */
    public function getJournalEntries(
        Organization $organization,
        array $filters = []
    ): Collection {
        $query = JournalEntry::where('organization_id', $organization->id)
            ->with(['transactions.account', 'createdBy', 'postedBy']);

        // Apply filters
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['start_date'])) {
            $query->where('entry_date', '>=', $filters['start_date']);
        }

        if (!empty($filters['end_date'])) {
            $query->where('entry_date', '<=', $filters['end_date']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('reference', 'like', "%{$search}%")
                  ->orWhere('entry_number', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('entry_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();
    }
}

