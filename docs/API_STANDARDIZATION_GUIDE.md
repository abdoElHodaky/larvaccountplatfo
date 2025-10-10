# API Standardization Guide

This document outlines the standardized API response format and conventions used across all API endpoints in the Laravel Account Platform.

## 📋 Table of Contents

- [Response Format](#response-format)
- [Status Codes](#status-codes)
- [Error Handling](#error-handling)
- [Pagination](#pagination)
- [Filtering and Searching](#filtering-and-searching)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)

## 🎯 Response Format

All API responses follow a consistent JSON structure:

### Success Response Format

```json
{
  "success": true,
  "status_code": 200,
  "message": "Request successful",
  "timestamp": "2024-10-10T05:22:40.000Z",
  "data": {
    // Response data here
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "status_code": 400,
  "timestamp": "2024-10-10T05:22:40.000Z",
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {
      // Additional error details (optional)
    }
  }
}
```

### Paginated Response Format

```json
{
  "success": true,
  "status_code": 200,
  "message": "Request successful",
  "timestamp": "2024-10-10T05:22:40.000Z",
  "data": {
    "items": [
      // Array of items
    ],
    "pagination": {
      "current_page": 1,
      "last_page": 5,
      "per_page": 15,
      "total": 75,
      "from": 1,
      "to": 15,
      "has_more_pages": true
    }
  }
}
```

## 📊 Status Codes

### Success Codes
- `200` - OK (Request successful)
- `201` - Created (Resource created successfully)
- `202` - Accepted (Request accepted for processing)
- `204` - No Content (Request successful, no content to return)

### Client Error Codes
- `400` - Bad Request (Invalid request format)
- `401` - Unauthorized (Authentication required)
- `403` - Forbidden (Access denied)
- `404` - Not Found (Resource not found)
- `405` - Method Not Allowed (HTTP method not supported)
- `409` - Conflict (Resource conflict)
- `422` - Unprocessable Entity (Validation failed)
- `429` - Too Many Requests (Rate limit exceeded)

### Server Error Codes
- `500` - Internal Server Error (Unexpected server error)
- `502` - Bad Gateway (Upstream server error)
- `503` - Service Unavailable (Service temporarily unavailable)

## ❌ Error Handling

### Validation Errors

```json
{
  "success": false,
  "status_code": 422,
  "timestamp": "2024-10-10T05:22:40.000Z",
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": {
      "name": ["The name field is required."],
      "email": ["The email field must be a valid email address."]
    }
  }
}
```

### Authentication Errors

```json
{
  "success": false,
  "status_code": 401,
  "timestamp": "2024-10-10T05:22:40.000Z",
  "error": {
    "message": "Authentication required",
    "code": "UNAUTHORIZED"
  }
}
```

### Not Found Errors

```json
{
  "success": false,
  "status_code": 404,
  "timestamp": "2024-10-10T05:22:40.000Z",
  "error": {
    "message": "Resource not found",
    "code": "NOT_FOUND"
  }
}
```

## 📄 Pagination

All list endpoints support pagination with the following parameters:

### Query Parameters
- `page` - Page number (default: 1)
- `per_page` - Items per page (default: 15, max: 100)

### Example Request
```
GET /api/inventory/products?page=2&per_page=20
```

### Example Response
```json
{
  "success": true,
  "status_code": 200,
  "message": "Request successful",
  "timestamp": "2024-10-10T05:22:40.000Z",
  "data": {
    "items": [
      // Product items
    ],
    "pagination": {
      "current_page": 2,
      "last_page": 5,
      "per_page": 20,
      "total": 95,
      "from": 21,
      "to": 40,
      "has_more_pages": true
    }
  }
}
```

## 🔍 Filtering and Searching

### Search Parameters
- `search` - General search term (searches across multiple fields)
- `sort_by` - Field to sort by
- `sort_direction` - Sort direction (`asc` or `desc`)

### Filter Parameters
Specific filters vary by endpoint but follow consistent naming:
- `status` - Filter by status
- `category_id` - Filter by category
- `date_from` - Filter from date
- `date_to` - Filter to date

### Example Request
```
GET /api/inventory/products?search=iPhone&category_id=1&status=active&sort_by=name&sort_direction=asc
```

## 🔐 Authentication

All API endpoints require authentication using Bearer tokens:

### Request Headers
```
Authorization: Bearer {your-api-token}
Content-Type: application/json
Accept: application/json
```

### Authentication Error Response
```json
{
  "success": false,
  "status_code": 401,
  "timestamp": "2024-10-10T05:22:40.000Z",
  "error": {
    "message": "Unauthenticated",
    "code": "UNAUTHORIZED"
  }
}
```

## ⏱️ Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Default Limit**: 60 requests per minute per user
- **Burst Limit**: 100 requests per minute for authenticated users

### Rate Limit Headers
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1697123456
```

### Rate Limit Exceeded Response
```json
{
  "success": false,
  "status_code": 429,
  "timestamp": "2024-10-10T05:22:40.000Z",
  "error": {
    "message": "Too many requests",
    "code": "RATE_LIMIT_EXCEEDED"
  }
}
```

## 📝 Examples

### Inventory API Examples

#### Get All Products
```bash
curl -X GET "https://api.example.com/api/inventory/products" \
  -H "Authorization: Bearer {token}" \
  -H "Accept: application/json"
```

#### Create Product
```bash
curl -X POST "https://api.example.com/api/inventory/products" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "name": "iPhone 15",
    "sku": "IPHONE-15-001",
    "category_id": 1,
    "price": 999.99,
    "cost_price": 600.00,
    "min_stock_level": 10,
    "status": "active"
  }'
```

#### Update Product
```bash
curl -X PUT "https://api.example.com/api/inventory/products/123" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "name": "iPhone 15 Pro",
    "price": 1199.99
  }'
```

### Accounting API Examples

#### Get Dashboard Data
```bash
curl -X GET "https://api.example.com/api/accounting/dashboard" \
  -H "Authorization: Bearer {token}" \
  -H "Accept: application/json"
```

#### Create Transaction
```bash
curl -X POST "https://api.example.com/api/accounting/transactions" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "account_id": 1,
    "amount": 1000.00,
    "type": "credit",
    "description": "Payment received",
    "reference": "PAY-001",
    "date": "2024-10-10"
  }'
```

## 🛠️ Implementation

### Using BaseApiController

All API controllers should extend `BaseApiController` for consistent responses:

```php
<?php

namespace App\Features\Inventory\Controllers\Api;

use App\Http\Controllers\Api\BaseApiController;
use App\Features\Inventory\Models\Product;
use Illuminate\Http\Request;

class ProductApiController extends BaseApiController
{
    public function index(Request $request)
    {
        try {
            $query = Product::query();
            
            // Apply filters
            $this->applyFilters($query, $request, [
                'category_id' => 'category_id',
                'status' => 'status',
            ]);
            
            // Apply search
            $this->applySearch($query, $request, ['name', 'sku', 'description']);
            
            // Apply sorting
            $this->applySorting($query, $request, ['name', 'sku', 'price', 'created_at']);
            
            // Paginate results
            [$perPage, $page] = $this->getPaginationParams($request);
            $products = $query->paginate($perPage, ['*'], 'page', $page);
            
            return $this->successWithPagination($products);
            
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }
    
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'sku' => 'required|string|unique:products',
                'category_id' => 'required|exists:categories,id',
                'price' => 'required|numeric|min:0',
            ]);
            
            $product = Product::create($validated);
            
            return $this->created($product, 'Product created successfully');
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->validationError($e->errors());
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }
}
```

### Middleware Registration

Register the API response middleware in `app/Http/Kernel.php`:

```php
protected $middlewareGroups = [
    'api' => [
        \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        'throttle:api',
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
        \App\Http\Middleware\ApiResponseMiddleware::class, // Add this line
    ],
];
```

## 🔄 Migration Guide

### Updating Existing Controllers

1. **Extend BaseApiController**: Change your controller to extend `BaseApiController`
2. **Update Response Methods**: Replace manual JSON responses with helper methods
3. **Standardize Error Handling**: Use the built-in exception handling
4. **Add Filtering/Searching**: Implement consistent filtering and searching

### Before (Old Format)
```php
public function index()
{
    $products = Product::all();
    return response()->json($products);
}
```

### After (Standardized Format)
```php
public function index(Request $request)
{
    try {
        $query = Product::query();
        $this->applyFilters($query, $request, ['status' => 'status']);
        $this->applySearch($query, $request, ['name', 'sku']);
        
        [$perPage] = $this->getPaginationParams($request);
        $products = $query->paginate($perPage);
        
        return $this->successWithPagination($products);
    } catch (\Exception $e) {
        return $this->handleException($e);
    }
}
```

## 📚 Additional Resources

- [Laravel API Resources Documentation](https://laravel.com/docs/eloquent-resources)
- [HTTP Status Code Reference](https://httpstatuses.com/)
- [REST API Best Practices](https://restfulapi.net/)

---

This standardization ensures consistent, predictable API responses across all endpoints, making it easier for frontend developers to integrate and handle API responses reliably.
