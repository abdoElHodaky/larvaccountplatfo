<?php

namespace App\Features\Accounting\GraphQL\Queries;

use App\Features\Accounting\Services\AccountingService;

class BalanceSheet
{
    protected AccountingService $accountingService;

    public function __construct(AccountingService $accountingService)
    {
        $this->accountingService = $accountingService;
    }

    /**
     * Get balance sheet report
     */
    public function __invoke($rootValue, array $args, $context, $resolveInfo)
    {
        $asOfDate = $args['as_of_date'] ?? now();
        
        return $this->accountingService->getBalanceSheet($asOfDate);
    }
}
