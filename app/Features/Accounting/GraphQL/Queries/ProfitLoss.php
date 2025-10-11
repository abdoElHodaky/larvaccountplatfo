<?php

namespace App\Features\Accounting\GraphQL\Queries;

use App\Features\Accounting\Services\AccountingService;

class ProfitLoss
{
    protected AccountingService $accountingService;

    public function __construct(AccountingService $accountingService)
    {
        $this->accountingService = $accountingService;
    }

    /**
     * Get profit and loss report
     */
    public function __invoke($rootValue, array $args, $context, $resolveInfo)
    {
        $fromDate = $args['from_date'] ?? now()->startOfMonth();
        $toDate = $args['to_date'] ?? now()->endOfMonth();

        return $this->accountingService->getProfitLoss($fromDate, $toDate);
    }
}
