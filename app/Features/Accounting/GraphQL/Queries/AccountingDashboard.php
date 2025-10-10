<?php

namespace App\Features\Accounting\GraphQL\Queries;

use App\Features\Accounting\Services\AccountingService;

class AccountingDashboard
{
    protected AccountingService $accountingService;

    public function __construct(AccountingService $accountingService)
    {
        $this->accountingService = $accountingService;
    }

    /**
     * Get accounting dashboard data
     */
    public function __invoke($rootValue, array $args, $context, $resolveInfo)
    {
        return $this->accountingService->getDashboardData();
    }
}
