<?php

namespace App\Features\Sales\Controllers\Api;

use App\Features\Sales\Models\SalesOrder;
use App\Features\Sales\Services\SalesService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SalesApiController extends Controller
{
    protected $salesService;

    public function __construct(SalesService $salesService)
    {
        $this->salesService = $salesService;
        $this->middleware('auth');
        $this->middleware('tenant');
    }

    public function dashboard(): JsonResponse
    {
        try {
            $organizationId = $this->getCurrentOrganizationId();
            $overview = $this->salesService->getDashboardOverview($organizationId);

            return response()->json([
                'success' => true,
                'data' => $overview,
                'message' => 'Sales dashboard data retrieved successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve sales dashboard data',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function getCustomers(Request $request): JsonResponse
    {
        try {
            $organizationId = $this->getCurrentOrganizationId();
            $filters = $request->only(['active_only', 'type', 'search']);
            $customers = $this->salesService->getCustomers($organizationId, $filters);

            return response()->json([
                'success' => true,
                'data' => $customers,
                'message' => 'Customers retrieved successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve customers',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function createCustomer(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'company_name' => 'nullable|string|max:255',
            'contact_person' => 'required|string|max:255',
            'email' => 'required|email|unique:customers,email',
            'phone' => 'nullable|string|max:20',
            'customer_type' => 'required|in:individual,business,government',
            'credit_limit' => 'nullable|numeric|min:0',
            'payment_terms' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $organizationId = $this->getCurrentOrganizationId();
            $customer = $this->salesService->createCustomer($organizationId, $validator->validated());

            return response()->json([
                'success' => true,
                'data' => $customer,
                'message' => 'Customer created successfully',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create customer',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function getSalesOrders(Request $request): JsonResponse
    {
        try {
            $organizationId = $this->getCurrentOrganizationId();
            $filters = $request->only(['status', 'customer_id', 'start_date', 'end_date']);
            $orders = $this->salesService->getSalesOrders($organizationId, $filters);

            return response()->json([
                'success' => true,
                'data' => $orders,
                'message' => 'Sales orders retrieved successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve sales orders',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function createSalesOrder(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'customer_id' => 'required|exists:customers,id',
            'order_date' => 'required|date',
            'delivery_date' => 'nullable|date|after:order_date',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $organizationId = $this->getCurrentOrganizationId();
            $order = $this->salesService->createSalesOrder($organizationId, $validator->validated());

            return response()->json([
                'success' => true,
                'data' => $order,
                'message' => 'Sales order created successfully',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create sales order',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function getSalesOrder(SalesOrder $salesOrder): JsonResponse
    {
        try {
            $salesOrder->load(['customer', 'items.product']);

            return response()->json([
                'success' => true,
                'data' => $salesOrder,
                'message' => 'Sales order retrieved successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve sales order',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function confirmSalesOrder(SalesOrder $salesOrder): JsonResponse
    {
        try {
            if (! $salesOrder->canBeConfirmed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Sales order cannot be confirmed in its current state',
                ], 400);
            }

            $salesOrder->confirm();

            return response()->json([
                'success' => true,
                'data' => $salesOrder->fresh(),
                'message' => 'Sales order confirmed successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to confirm sales order',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    private function getCurrentOrganizationId(): int
    {
        return auth()->user()->current_organization_id ?? 1;
    }
}
