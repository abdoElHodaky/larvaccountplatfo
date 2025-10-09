<?php

namespace App\Features\Sales\Controllers;

use App\Features\Sales\Services\SalesService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SalesController extends Controller
{
    protected $salesService;

    public function __construct(SalesService $salesService)
    {
        $this->salesService = $salesService;
        $this->middleware('auth');
        $this->middleware('tenant');
    }

    /**
     * Display sales dashboard page
     */
    public function index(): Response
    {
        try {
            $organizationId = $this->getCurrentOrganizationId();
            $overview = $this->salesService->getDashboardOverview($organizationId);
            
            // Get recent orders and customers
            $recentOrders = $this->salesService->getRecentOrders($organizationId, 10);
            $topCustomers = $this->salesService->getTopCustomers($organizationId, 5);
            $salesTrends = $this->salesService->getSalesTrends($organizationId);

            return Inertia::render('Sales/Dashboard', [
                'overview' => $overview,
                'recentOrders' => $recentOrders,
                'topCustomers' => $topCustomers,
                'salesTrends' => $salesTrends,
                'organization' => [
                    'id' => $organizationId,
                    'name' => auth()->user()->current_organization->name ?? 'Default Organization',
                ],
            ]);

        } catch (\Exception $e) {
            \Log::error('Sales dashboard error: ' . $e->getMessage());
            
            // Return error page with Inertia
            return Inertia::render('Sales/Dashboard', [
                'overview' => null,
                'recentOrders' => [],
                'topCustomers' => [],
                'salesTrends' => [],
                'error' => 'Failed to load sales data. Please try again.',
                'organization' => [
                    'id' => $this->getCurrentOrganizationId(),
                    'name' => auth()->user()->current_organization->name ?? 'Default Organization',
                ],
            ]);
        }
    }

    /**
     * Display customers page
     */
    public function customers(): Response
    {
        try {
            $organizationId = $this->getCurrentOrganizationId();
            $customers = $this->salesService->getCustomers($organizationId, ['active_only' => false]);
            $customerStats = $this->salesService->getCustomerStats($organizationId);

            return Inertia::render('Sales/Customers', [
                'customers' => $customers,
                'stats' => $customerStats,
                'organization' => [
                    'id' => $organizationId,
                    'name' => auth()->user()->current_organization->name ?? 'Default Organization',
                ],
            ]);

        } catch (\Exception $e) {
            \Log::error('Sales customers error: ' . $e->getMessage());
            
            return Inertia::render('Sales/Customers', [
                'customers' => [],
                'stats' => null,
                'error' => 'Failed to load customer data. Please try again.',
                'organization' => [
                    'id' => $this->getCurrentOrganizationId(),
                    'name' => auth()->user()->current_organization->name ?? 'Default Organization',
                ],
            ]);
        }
    }

    /**
     * Display orders page
     */
    public function orders(): Response
    {
        try {
            $organizationId = $this->getCurrentOrganizationId();
            $orders = $this->salesService->getSalesOrders($organizationId);
            $orderStats = $this->salesService->getOrderStats($organizationId);

            return Inertia::render('Sales/Orders', [
                'orders' => $orders,
                'stats' => $orderStats,
                'organization' => [
                    'id' => $organizationId,
                    'name' => auth()->user()->current_organization->name ?? 'Default Organization',
                ],
            ]);

        } catch (\Exception $e) {
            \Log::error('Sales orders error: ' . $e->getMessage());
            
            return Inertia::render('Sales/Orders', [
                'orders' => [],
                'stats' => null,
                'error' => 'Failed to load order data. Please try again.',
                'organization' => [
                    'id' => $this->getCurrentOrganizationId(),
                    'name' => auth()->user()->current_organization->name ?? 'Default Organization',
                ],
            ]);
        }
    }

    /**
     * Display create order page
     */
    public function createOrder(): Response
    {
        try {
            $organizationId = $this->getCurrentOrganizationId();
            $customers = $this->salesService->getCustomers($organizationId, ['active_only' => true]);
            $products = $this->salesService->getAvailableProducts($organizationId);

            return Inertia::render('Sales/CreateOrder', [
                'customers' => $customers,
                'products' => $products,
                'organization' => [
                    'id' => $organizationId,
                    'name' => auth()->user()->current_organization->name ?? 'Default Organization',
                ],
            ]);

        } catch (\Exception $e) {
            \Log::error('Sales create order error: ' . $e->getMessage());
            
            return Inertia::render('Sales/CreateOrder', [
                'customers' => [],
                'products' => [],
                'error' => 'Failed to load order creation data. Please try again.',
                'organization' => [
                    'id' => $this->getCurrentOrganizationId(),
                    'name' => auth()->user()->current_organization->name ?? 'Default Organization',
                ],
            ]);
        }
    }

    /**
     * Display create customer page
     */
    public function createCustomer(): Response
    {
        try {
            $organizationId = $this->getCurrentOrganizationId();

            return Inertia::render('Sales/CreateCustomer', [
                'organization' => [
                    'id' => $organizationId,
                    'name' => auth()->user()->current_organization->name ?? 'Default Organization',
                ],
            ]);

        } catch (\Exception $e) {
            \Log::error('Sales create customer error: ' . $e->getMessage());
            
            return Inertia::render('Sales/CreateCustomer', [
                'error' => 'Failed to load customer creation page. Please try again.',
                'organization' => [
                    'id' => $this->getCurrentOrganizationId(),
                    'name' => auth()->user()->current_organization->name ?? 'Default Organization',
                ],
            ]);
        }
    }

    /**
     * Get current organization ID
     */
    protected function getCurrentOrganizationId(): int
    {
        return auth()->user()->current_organization_id ?? 1;
    }
}
