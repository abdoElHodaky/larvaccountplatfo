<?php

namespace Modules\Accounting\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTransactionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Add proper authorization logic here
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'transaction_date' => ['required', 'date'],
            'description' => ['required', 'string', 'max:500'],
            'reference' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'type' => [
                'required',
                'string',
                Rule::in([
                    'journal_entry',
                    'invoice',
                    'payment',
                    'receipt',
                    'transfer',
                    'adjustment',
                    'opening_balance',
                    'closing_entry'
                ]),
            ],
            'currency' => ['required', 'string', 'size:3'],
            'exchange_rate' => ['nullable', 'numeric', 'min:0.0001'],
            'metadata' => ['nullable', 'array'],
            
            // Journal entries validation
            'journal_entries' => ['required', 'array', 'min:2'],
            'journal_entries.*.id' => ['nullable', 'exists:journal_entries,id'],
            'journal_entries.*.account_id' => ['required', 'exists:accounts,id'],
            'journal_entries.*.description' => ['nullable', 'string', 'max:255'],
            'journal_entries.*.debit_amount' => ['nullable', 'numeric', 'min:0'],
            'journal_entries.*.credit_amount' => ['nullable', 'numeric', 'min:0'],
            'journal_entries.*.currency' => ['nullable', 'string', 'size:3'],
            'journal_entries.*.exchange_rate' => ['nullable', 'numeric', 'min:0.0001'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'transaction_date.required' => 'Transaction date is required.',
            'description.required' => 'Transaction description is required.',
            'type.in' => 'Invalid transaction type selected.',
            'currency.size' => 'Currency must be a 3-letter ISO code.',
            'journal_entries.required' => 'At least two journal entries are required.',
            'journal_entries.min' => 'At least two journal entries are required for double-entry bookkeeping.',
            'journal_entries.*.account_id.required' => 'Account is required for each journal entry.',
            'journal_entries.*.account_id.exists' => 'Selected account does not exist.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Set default values
        $this->merge([
            'currency' => $this->input('currency', 'USD'),
            'exchange_rate' => $this->input('exchange_rate', 1.0),
        ]);

        // Ensure each journal entry has proper currency and exchange rate
        if ($this->has('journal_entries')) {
            $journalEntries = $this->input('journal_entries');
            foreach ($journalEntries as $index => $entry) {
                $journalEntries[$index]['currency'] = $entry['currency'] ?? $this->input('currency', 'USD');
                $journalEntries[$index]['exchange_rate'] = $entry['exchange_rate'] ?? 1.0;
            }
            $this->merge(['journal_entries' => $journalEntries]);
        }
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $transaction = $this->route('transaction');

        $validator->after(function ($validator) use ($transaction) {
            // Only allow updates to draft transactions
            if ($transaction->status !== 'draft') {
                $validator->errors()->add('status', 'Only draft transactions can be updated.');
                return;
            }

            $journalEntries = $this->input('journal_entries', []);
            
            // Validate that each journal entry has either debit or credit (but not both)
            foreach ($journalEntries as $index => $entry) {
                $debitAmount = (float) ($entry['debit_amount'] ?? 0);
                $creditAmount = (float) ($entry['credit_amount'] ?? 0);
                
                if ($debitAmount > 0 && $creditAmount > 0) {
                    $validator->errors()->add(
                        "journal_entries.{$index}",
                        'Journal entry cannot have both debit and credit amounts.'
                    );
                }
                
                if ($debitAmount == 0 && $creditAmount == 0) {
                    $validator->errors()->add(
                        "journal_entries.{$index}",
                        'Journal entry must have either a debit or credit amount.'
                    );
                }
            }
            
            // Validate that debits equal credits (balanced transaction)
            $totalDebits = 0;
            $totalCredits = 0;
            
            foreach ($journalEntries as $entry) {
                $totalDebits += (float) ($entry['debit_amount'] ?? 0);
                $totalCredits += (float) ($entry['credit_amount'] ?? 0);
            }
            
            if (abs($totalDebits - $totalCredits) > 0.01) {
                $validator->errors()->add(
                    'journal_entries',
                    'Transaction must be balanced. Total debits must equal total credits.'
                );
            }
            
            // Validate that accounts allow manual entries
            foreach ($journalEntries as $index => $entry) {
                if (isset($entry['account_id'])) {
                    $account = \Modules\Accounting\Models\Account::find($entry['account_id']);
                    if ($account && !$account->allow_manual_entries) {
                        $validator->errors()->add(
                            "journal_entries.{$index}.account_id",
                            'This account does not allow manual journal entries.'
                        );
                    }
                }
            }

            // Validate that existing journal entries belong to this transaction
            foreach ($journalEntries as $index => $entry) {
                if (isset($entry['id'])) {
                    $journalEntry = \Modules\Accounting\Models\JournalEntry::find($entry['id']);
                    if ($journalEntry && $journalEntry->transaction_id !== $transaction->id) {
                        $validator->errors()->add(
                            "journal_entries.{$index}.id",
                            'Journal entry does not belong to this transaction.'
                        );
                    }
                }
            }
        });
    }
}
