<?php

namespace App\Features\Accounting\GraphQL\Mutations;

use App\Features\Accounting\Services\AccountingService;
use Illuminate\Validation\ValidationException;

class CreateJournalEntry
{
    protected AccountingService $accountingService;

    public function __construct(AccountingService $accountingService)
    {
        $this->accountingService = $accountingService;
    }

    /**
     * Create a new journal entry
     */
    public function __invoke($rootValue, array $args, $context, $resolveInfo)
    {
        // Validate that debits equal credits
        $totalDebits = collect($args['entries'])->sum('debit');
        $totalCredits = collect($args['entries'])->sum('credit');

        if ($totalDebits !== $totalCredits) {
            throw ValidationException::withMessages([
                'entries' => ['Total debits must equal total credits'],
            ]);
        }

        return $this->accountingService->createJournalEntry([
            'date' => $args['date'],
            'reference' => $args['reference'],
            'description' => $args['description'] ?? null,
            'entries' => $args['entries'],
        ]);
    }
}
