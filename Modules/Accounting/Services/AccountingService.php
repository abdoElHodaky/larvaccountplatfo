<?php

namespace Modules\Accounting\Services;

use Illuminate\Support\Facades\DB;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\Transaction;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Services\DoubleEntryService;

class AccountingService
{
    public function __construct(
        private DoubleEntryService $doubleEntryService
    ) {}

    /**
     * Create a new account
     */
    public function createAccount(array $data): Account
    {
        return DB::transaction(function () use ($data) {
            // Generate account code if not provided
            if (empty($data['code'])) {
                $data['code'] = $this->generateAccountCode($data['type'], $data['parent_id'] ?? null);
            }

            // Validate account code uniqueness
            if (Account::where('tenant_id', tenant()->id)->where('code', $data['code'])->exists()) {
                throw new \Exception("Account code {$data['code']} already exists");
            }

            // Set tenant ID
            $data['tenant_id'] = tenant()->id;

            // Create the account
            $account = Account::create($data);

            // Log the creation
            activity()
                ->performedOn($account)
                ->causedBy(auth()->user())
                ->log('Account created');

            return $account;
        });
    }

    /**
     * Update an existing account
     */
    public function updateAccount(Account $account, array $data): Account
    {
        return DB::transaction(function () use ($account, $data) {
            // Prevent changes to system accounts
            if ($account->is_system) {
                throw new \Exception('System accounts cannot be modified');
            }

            // Validate account code uniqueness if changed
            if (isset($data['code']) && $data['code'] !== $account->code) {
                if (Account::where('tenant_id', tenant()->id)
                    ->where('code', $data['code'])
                    ->where('id', '!=', $account->id)
                    ->exists()) {
                    throw new \Exception("Account code {$data['code']} already exists");
                }
            }

            // Update the account
            $account->update($data);

            // Log the update
            activity()
                ->performedOn($account)
                ->causedBy(auth()->user())
                ->log('Account updated');

            return $account;
        });
    }

    /**
     * Create a journal entry transaction
     */
    public function createJournalEntry(array $data): Transaction
    {
        return DB::transaction(function () use ($data) {
            // Validate the journal entry
            $this->validateJournalEntry($data);

            // Create the transaction
            $transaction = Transaction::create([
                'tenant_id' => tenant()->id,
                'transaction_number' => $this->generateTransactionNumber(),
                'type' => 'journal_entry',
                'transaction_date' => $data['transaction_date'],
                'description' => $data['description'],
                'notes' => $data['notes'] ?? null,
                'total_amount' => collect($data['entries'])->sum('amount'),
                'currency' => $data['currency'] ?? 'USD',
                'status' => $data['status'] ?? 'draft',
                'created_by' => auth()->id(),
                'metadata' => $data['metadata'] ?? null,
            ]);

            // Create journal entries
            foreach ($data['entries'] as $entryData) {
                $this->createJournalEntryLine($transaction, $entryData);
            }

            // Auto-post if requested
            if (($data['auto_post'] ?? false) && $transaction->status === 'draft') {
                $this->postTransaction($transaction);
            }

            // Log the creation
            activity()
                ->performedOn($transaction)
                ->causedBy(auth()->user())
                ->log('Journal entry created');

            return $transaction->load(['journalEntries.account']);
        });
    }

    /**
     * Post a transaction
     */
    public function postTransaction(Transaction $transaction): Transaction
    {
        return DB::transaction(function () use ($transaction) {
            if ($transaction->status !== 'draft' && $transaction->status !== 'pending') {
                throw new \Exception('Only draft or pending transactions can be posted');
            }

            // Validate double-entry balance
            if (!$this->doubleEntryService->isBalanced($transaction)) {
                throw new \Exception('Transaction is not balanced');
            }

            // Update transaction status
            $transaction->update([
                'status' => 'posted',
                'posted_at' => now(),
                'approved_by' => auth()->id(),
                'approved_at' => now(),
            ]);

            // Update account balances
            foreach ($transaction->journalEntries as $entry) {
                $this->updateAccountBalance($entry->account, $entry);
            }

            // Log the posting
            activity()
                ->performedOn($transaction)
                ->causedBy(auth()->user())
                ->log('Transaction posted');

            return $transaction;
        });
    }

    /**
     * Reverse a transaction
     */
    public function reverseTransaction(Transaction $transaction, string $reason): Transaction
    {
        return DB::transaction(function () use ($transaction, $reason) {
            if ($transaction->status !== 'posted') {
                throw new \Exception('Only posted transactions can be reversed');
            }

            // Create reversal transaction
            $reversalTransaction = Transaction::create([
                'tenant_id' => $transaction->tenant_id,
                'transaction_number' => $this->generateTransactionNumber(),
                'type' => $transaction->type,
                'transaction_date' => now()->toDateString(),
                'description' => "Reversal of: {$transaction->description}",
                'notes' => $reason,
                'total_amount' => $transaction->total_amount,
                'currency' => $transaction->currency,
                'status' => 'posted',
                'created_by' => auth()->id(),
                'posted_at' => now(),
                'approved_by' => auth()->id(),
                'approved_at' => now(),
                'reversal_of' => $transaction->id,
            ]);

            // Create reverse journal entries
            foreach ($transaction->journalEntries as $originalEntry) {
                $reversalEntry = JournalEntry::create([
                    'tenant_id' => $originalEntry->tenant_id,
                    'transaction_id' => $reversalTransaction->id,
                    'account_id' => $originalEntry->account_id,
                    'type' => $originalEntry->type === 'debit' ? 'credit' : 'debit',
                    'amount' => $originalEntry->amount,
                    'currency' => $originalEntry->currency,
                    'exchange_rate' => $originalEntry->exchange_rate,
                    'base_amount' => $originalEntry->base_amount,
                    'description' => "Reversal of: {$originalEntry->description}",
                    'reference' => $originalEntry->reference,
                ]);

                // Update account balance
                $this->updateAccountBalance($reversalEntry->account, $reversalEntry);
            }

            // Mark original transaction as reversed
            $transaction->update([
                'status' => 'reversed',
                'reversed_at' => now(),
                'reversed_by' => auth()->id(),
            ]);

            // Log the reversal
            activity()
                ->performedOn($transaction)
                ->causedBy(auth()->user())
                ->log('Transaction reversed');

            return $reversalTransaction->load(['journalEntries.account']);
        });
    }

    /**
     * Generate account code
     */
    private function generateAccountCode(string $type, ?int $parentId = null): string
    {
        $typePrefix = [
            'asset' => '1',
            'liability' => '2',
            'equity' => '3',
            'revenue' => '4',
            'expense' => '5',
        ];

        $prefix = $typePrefix[$type] ?? '9';

        if ($parentId) {
            $parent = Account::find($parentId);
            $prefix = $parent->code;
        }

        // Find the next available code
        $lastAccount = Account::where('tenant_id', tenant()->id)
            ->where('code', 'like', $prefix . '%')
            ->orderBy('code', 'desc')
            ->first();

        if (!$lastAccount) {
            return $prefix . '000';
        }

        $lastNumber = (int) substr($lastAccount->code, strlen($prefix));
        $nextNumber = $lastNumber + 10; // Increment by 10 to leave room for sub-accounts

        return $prefix . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Generate transaction number
     */
    private function generateTransactionNumber(): string
    {
        $year = date('Y');
        $month = date('m');
        
        $lastTransaction = Transaction::where('tenant_id', tenant()->id)
            ->where('transaction_number', 'like', "JE-{$year}{$month}-%")
            ->orderBy('transaction_number', 'desc')
            ->first();

        if (!$lastTransaction) {
            $sequence = 1;
        } else {
            $lastSequence = (int) substr($lastTransaction->transaction_number, -4);
            $sequence = $lastSequence + 1;
        }

        return "JE-{$year}{$month}-" . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Validate journal entry data
     */
    private function validateJournalEntry(array $data): void
    {
        if (empty($data['entries']) || count($data['entries']) < 2) {
            throw new \Exception('Journal entry must have at least 2 entries');
        }

        $debits = 0;
        $credits = 0;

        foreach ($data['entries'] as $entry) {
            if ($entry['type'] === 'debit') {
                $debits += $entry['amount'];
            } else {
                $credits += $entry['amount'];
            }
        }

        if (abs($debits - $credits) > 0.01) { // Allow for small rounding differences
            throw new \Exception('Journal entry is not balanced. Debits: ' . $debits . ', Credits: ' . $credits);
        }
    }

    /**
     * Create a journal entry line
     */
    private function createJournalEntryLine(Transaction $transaction, array $entryData): JournalEntry
    {
        $account = Account::findOrFail($entryData['account_id']);

        return JournalEntry::create([
            'tenant_id' => $transaction->tenant_id,
            'transaction_id' => $transaction->id,
            'account_id' => $account->id,
            'type' => $entryData['type'],
            'amount' => $entryData['amount'],
            'currency' => $entryData['currency'] ?? $transaction->currency,
            'exchange_rate' => $entryData['exchange_rate'] ?? 1.0,
            'base_amount' => $entryData['amount'] * ($entryData['exchange_rate'] ?? 1.0),
            'description' => $entryData['description'] ?? $transaction->description,
            'reference' => $entryData['reference'] ?? null,
            'department' => $entryData['department'] ?? null,
            'project' => $entryData['project'] ?? null,
            'cost_center' => $entryData['cost_center'] ?? null,
            'dimensions' => $entryData['dimensions'] ?? null,
        ]);
    }

    /**
     * Update account balance after posting an entry
     */
    private function updateAccountBalance(Account $account, JournalEntry $entry): void
    {
        if ($entry->type === 'debit') {
            if ($account->isDebitAccount()) {
                $account->current_balance += $entry->base_amount;
            } else {
                $account->current_balance -= $entry->base_amount;
            }
        } else { // credit
            if ($account->isCreditAccount()) {
                $account->current_balance += $entry->base_amount;
            } else {
                $account->current_balance -= $entry->base_amount;
            }
        }

        $account->save();
    }

    /**
     * Get trial balance
     */
    public function getTrialBalance(\DateTime $asOfDate = null): array
    {
        $asOfDate = $asOfDate ?? now();

        $accounts = Account::query()
            ->active()
            ->with(['journalEntries' => function ($query) use ($asOfDate) {
                $query->whereHas('transaction', function ($q) use ($asOfDate) {
                    $q->where('transaction_date', '<=', $asOfDate)
                      ->where('status', 'posted');
                });
            }])
            ->get();

        $trialBalance = [];
        $totalDebits = 0;
        $totalCredits = 0;

        foreach ($accounts as $account) {
            $balance = $account->getBalanceAt($asOfDate);
            
            if ($balance != 0) {
                $debitBalance = $account->isDebitAccount() && $balance > 0 ? $balance : 0;
                $creditBalance = $account->isCreditAccount() && $balance > 0 ? $balance : 0;
                
                // Handle negative balances (contra accounts)
                if ($balance < 0) {
                    $debitBalance = $account->isCreditAccount() ? abs($balance) : 0;
                    $creditBalance = $account->isDebitAccount() ? abs($balance) : 0;
                }

                $trialBalance[] = [
                    'account' => $account,
                    'debit_balance' => $debitBalance,
                    'credit_balance' => $creditBalance,
                ];

                $totalDebits += $debitBalance;
                $totalCredits += $creditBalance;
            }
        }

        return [
            'accounts' => $trialBalance,
            'total_debits' => $totalDebits,
            'total_credits' => $totalCredits,
            'is_balanced' => abs($totalDebits - $totalCredits) < 0.01,
            'as_of_date' => $asOfDate,
        ];
    }
}
