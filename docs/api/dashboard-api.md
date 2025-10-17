# Dashboard API Documentation

## Overview

The Dashboard API provides comprehensive endpoints for managing dashboard widgets, layouts, preferences, and analytics. It follows RESTful principles and returns JSON responses.

## Base URL

```
/api/dashboard
```

## Authentication

All endpoints require authentication via Laravel Sanctum. Include the authentication token in the `Authorization` header:

```
Authorization: Bearer {token}
```

## Response Format

All API responses follow this standard format:

```json
{
  "success": boolean,
  "data": any,
  "message": string,
  "error": string
}
```

## Dashboard Endpoints

### Get Dashboard

Retrieves the complete dashboard for the authenticated user.

**Endpoint:** `GET /api/dashboard`

**Response:**
```json
{
  "success": true,
  "data": {
    "widgets": [
      {
        "id": 1,
        "organization_id": 1,
        "user_id": 1,
        "widget_type": "financial_summary",
        "title": "Financial Overview",
        "description": "Key financial metrics",
        "size": "medium",
        "position": 1,
        "configuration": {
          "period": "last_12_months",
          "metrics": ["revenue", "profit", "expenses"]
        },
        "is_active": true,
        "created_at": "2024-10-16T10:00:00Z",
        "updated_at": "2024-10-16T10:00:00Z"
      }
    ],
    "layout": {
      "id": 1,
      "organization_id": 1,
      "user_id": 1,
      "grid_columns": 12,
      "grid_rows": "auto",
      "widget_positions": {},
      "theme": "default",
      "sidebar_collapsed": false,
      "header_visible": true,
      "footer_visible": true,
      "created_at": "2024-10-16T10:00:00Z",
      "updated_at": "2024-10-16T10:00:00Z"
    },
    "preferences": {
      "id": 1,
      "organization_id": 1,
      "user_id": 1,
      "auto_refresh": true,
      "refresh_interval": 300,
      "show_animations": true,
      "compact_mode": false,
      "currency_format": "USD",
      "date_format": "MM/DD/YYYY",
      "timezone": "UTC",
      "language": "en",
      "created_at": "2024-10-16T10:00:00Z",
      "updated_at": "2024-10-16T10:00:00Z"
    },
    "analytics": {},
    "performance": {}
  }
}
```

### Refresh Dashboard

Refreshes all dashboard data and clears caches.

**Endpoint:** `POST /api/dashboard/refresh`

**Response:**
```json
{
  "success": true,
  "message": "Dashboard refreshed successfully"
}
```

### Get Performance Insights

Retrieves performance metrics and insights for the dashboard.

**Endpoint:** `GET /api/dashboard/performance`

**Response:**
```json
{
  "success": true,
  "data": {
    "metrics": {
      "load_time": 1250,
      "cache_hit_rate": 0.85,
      "widget_render_times": {
        "1": 150,
        "2": 200
      }
    },
    "insights": [
      {
        "type": "performance",
        "message": "Dashboard loads 15% faster than average",
        "severity": "info"
      }
    ]
  }
}
```

### Get Widget Recommendations

Retrieves personalized widget recommendations.

**Endpoint:** `GET /api/dashboard/recommendations`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "widget_type": "cash_flow",
      "title": "Cash Flow Widget",
      "description": "Track your cash flow trends",
      "confidence": 0.85,
      "reasons": ["Based on your financial data usage", "Popular with similar users"]
    }
  ]
}
```

### Customize Dashboard

Updates dashboard layout and preferences.

**Endpoint:** `PUT /api/dashboard/customize`

**Request Body:**
```json
{
  "layout": {
    "theme": "dark",
    "grid_columns": 12,
    "sidebar_collapsed": true
  },
  "preferences": {
    "auto_refresh": false,
    "refresh_interval": 600,
    "compact_mode": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Dashboard customized successfully"
}
```

### Export Dashboard

Exports dashboard data in various formats.

**Endpoint:** `POST /api/dashboard/export`

**Request Body:**
```json
{
  "format": "pdf",
  "options": {
    "include_charts": true,
    "date_range": "last_month"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "file_path": "/exports/dashboard_2024-10-16.pdf",
    "download_url": "/api/dashboard/download/dashboard_2024-10-16.pdf"
  },
  "message": "Dashboard exported successfully"
}
```

### Generate Report

Generates various types of dashboard reports.

**Endpoint:** `POST /api/dashboard/reports`

**Request Body:**
```json
{
  "report_type": "executive_summary",
  "options": {
    "period": "last_quarter",
    "include_forecasts": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "report": {
      "title": "Executive Summary - Q3 2024",
      "sections": [
        {
          "title": "Key Metrics",
          "data": {}
        }
      ],
      "generated_at": "2024-10-16T10:00:00Z"
    }
  }
}
```

## Widget Endpoints

### Get Widgets

Retrieves widgets with optional filtering.

**Endpoint:** `GET /api/dashboard/widgets`

**Query Parameters:**
- `widget_type` (string): Filter by widget type
- `is_active` (boolean): Filter by active status
- `search` (string): Search in title and description
- `sort_by` (string): Sort field (default: position)
- `sort_direction` (string): Sort direction (asc/desc)
- `per_page` (integer): Items per page (default: 15)

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 1,
        "widget_type": "financial_summary",
        "title": "Financial Overview",
        "description": "Key financial metrics",
        "size": "medium",
        "position": 1,
        "configuration": {},
        "is_active": true,
        "created_at": "2024-10-16T10:00:00Z",
        "updated_at": "2024-10-16T10:00:00Z"
      }
    ],
    "total": 5,
    "per_page": 15,
    "current_page": 1
  }
}
```

### Create Widget

Creates a new dashboard widget.

**Endpoint:** `POST /api/dashboard/widgets`

**Request Body:**
```json
{
  "widget_type": "revenue_chart",
  "title": "Monthly Revenue",
  "description": "Revenue trends over time",
  "size": "large",
  "configuration": {
    "chart_type": "line",
    "period": "last_12_months"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "organization_id": 1,
    "user_id": 1,
    "widget_type": "revenue_chart",
    "title": "Monthly Revenue",
    "description": "Revenue trends over time",
    "size": "large",
    "position": 2,
    "configuration": {
      "chart_type": "line",
      "period": "last_12_months"
    },
    "is_active": true,
    "created_at": "2024-10-16T10:00:00Z",
    "updated_at": "2024-10-16T10:00:00Z"
  },
  "message": "Widget created successfully"
}
```

### Get Widget

Retrieves a specific widget with its data and metrics.

**Endpoint:** `GET /api/dashboard/widgets/{id}`

**Response:**
```json
{
  "success": true,
  "data": {
    "widget": {
      "id": 1,
      "widget_type": "financial_summary",
      "title": "Financial Overview",
      "configuration": {},
      "is_active": true
    },
    "data": {
      "revenue": 125000,
      "profit": 25000,
      "expenses": 100000
    },
    "metrics": {
      "last_updated": "2024-10-16T10:00:00Z",
      "render_time": 150,
      "cache_hit": true
    }
  }
}
```

### Update Widget

Updates an existing widget.

**Endpoint:** `PUT /api/dashboard/widgets/{id}`

**Request Body:**
```json
{
  "title": "Updated Financial Overview",
  "description": "Updated description",
  "size": "large",
  "configuration": {
    "period": "last_6_months"
  },
  "is_active": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Updated Financial Overview",
    "description": "Updated description",
    "size": "large",
    "configuration": {
      "period": "last_6_months"
    },
    "is_active": true,
    "updated_at": "2024-10-16T10:30:00Z"
  },
  "message": "Widget updated successfully"
}
```

### Delete Widget

Deletes a widget.

**Endpoint:** `DELETE /api/dashboard/widgets/{id}`

**Response:**
```json
{
  "success": true,
  "message": "Widget deleted successfully"
}
```

### Duplicate Widget

Creates a copy of an existing widget.

**Endpoint:** `POST /api/dashboard/widgets/{id}/duplicate`

**Request Body (optional):**
```json
{
  "title": "Copy of Financial Overview",
  "position": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "title": "Copy of Financial Overview",
    "widget_type": "financial_summary",
    "position": 5,
    "configuration": {},
    "is_active": true,
    "created_at": "2024-10-16T10:30:00Z"
  },
  "message": "Widget duplicated successfully"
}
```

### Reorder Widgets

Updates the position order of multiple widgets.

**Endpoint:** `POST /api/dashboard/widgets/reorder`

**Request Body:**
```json
{
  "widget_order": [3, 1, 2, 4]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Widgets reordered successfully"
}
```

### Update Widget Configuration

Updates only the configuration of a widget.

**Endpoint:** `PUT /api/dashboard/widgets/{id}/configuration`

**Request Body:**
```json
{
  "configuration": {
    "chart_type": "bar",
    "period": "last_3_months",
    "show_legend": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "configuration": {
      "chart_type": "bar",
      "period": "last_3_months",
      "show_legend": true
    },
    "updated_at": "2024-10-16T10:30:00Z"
  },
  "message": "Widget configuration updated successfully"
}
```

### Get Configuration Schema

Retrieves the configuration schema for a widget type.

**Endpoint:** `GET /api/dashboard/widgets/types/{widgetType}/schema`

**Response:**
```json
{
  "success": true,
  "data": {
    "type": "object",
    "properties": {
      "period": {
        "type": "string",
        "enum": ["last_7_days", "last_30_days", "last_3_months", "last_6_months", "last_12_months"],
        "default": "last_12_months"
      },
      "chart_type": {
        "type": "string",
        "enum": ["line", "bar", "area"],
        "default": "line"
      },
      "show_legend": {
        "type": "boolean",
        "default": true
      }
    },
    "required": ["period"]
  }
}
```

### Get Available Widget Types

Retrieves all available widget types and their capabilities.

**Endpoint:** `GET /api/dashboard/widgets/types`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "type": "financial_summary",
      "name": "Financial Summary",
      "description": "Overview of key financial metrics",
      "category": "financial",
      "sizes": ["small", "medium", "large"],
      "default_size": "medium",
      "capabilities": ["real_time", "export", "drill_down"]
    },
    {
      "type": "revenue_chart",
      "name": "Revenue Chart",
      "description": "Revenue trends over time",
      "category": "financial",
      "sizes": ["medium", "large"],
      "default_size": "large",
      "capabilities": ["real_time", "export", "interactive"]
    }
  ]
}
```

### Refresh Widget Data

Forces a refresh of widget data, bypassing cache.

**Endpoint:** `POST /api/dashboard/widgets/{id}/refresh`

**Response:**
```json
{
  "success": true,
  "data": {
    "revenue": 127500,
    "profit": 26000,
    "expenses": 101500,
    "last_updated": "2024-10-16T10:35:00Z"
  },
  "message": "Widget data refreshed successfully"
}
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "success": false,
  "error": "Error message",
  "message": "User-friendly error message"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

### Validation Errors

Validation errors return a `422` status with detailed field errors:

```json
{
  "success": false,
  "error": "Validation failed",
  "message": "The given data was invalid.",
  "errors": {
    "title": ["The title field is required."],
    "widget_type": ["The selected widget type is invalid."]
  }
}
```

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **Dashboard endpoints**: 60 requests per minute
- **Widget CRUD operations**: 30 requests per minute
- **Data refresh endpoints**: 10 requests per minute

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1634400000
```

## Caching

The API implements intelligent caching:

- **Widget data**: Cached for 5 minutes
- **Dashboard layout**: Cached for 1 hour
- **Performance metrics**: Cached for 10 minutes
- **Configuration schemas**: Cached for 24 hours

Cache headers indicate cache status:

```
X-Cache-Status: HIT
X-Cache-TTL: 300
```

## WebSocket Integration

For real-time updates, connect to the WebSocket endpoint:

```
ws://localhost/ws/dashboard
```

### WebSocket Events

- `widget_data_updated` - Widget data has changed
- `dashboard_updated` - Dashboard layout or preferences changed
- `widget_configured` - Widget configuration updated
- `performance_updated` - Performance metrics updated

### WebSocket Message Format

```json
{
  "type": "widget_data_updated",
  "data": {
    "widget_id": 1,
    "data": {},
    "updated_at": "2024-10-16T10:00:00Z"
  },
  "timestamp": "2024-10-16T10:00:00Z"
}
```
