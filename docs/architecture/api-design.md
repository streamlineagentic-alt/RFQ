# API Design - RFQ Management Platform

## Overview
RESTful API design for all 8 workflows (A-H). Built with Express/Fastify on Node.js.

**Base URL**: `/api/v1`

---

## Authentication

### POST /auth/register
Register a new user (buyer or supplier).

**Request:**
```json
{
  "email": "buyer@example.com",
  "password": "SecurePass123!",
  "role": "buyer",
  "first_name": "John",
  "last_name": "Doe",
  "company_name": "Acme Corp",
  "phone": "+1-555-0100"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": 1,
    "email": "buyer@example.com",
    "role": "buyer",
    "first_name": "John",
    "last_name": "Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### POST /auth/login
Authenticate user and receive JWT token.

**Request:**
```json
{
  "email": "buyer@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": 1,
    "email": "buyer@example.com",
    "role": "buyer",
    "company_name": "Acme Corp"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### POST /auth/logout
Invalidate current session.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

---

## Workflow A: RFQ Intake

### POST /rfqs
Create a new RFQ (form-based or file upload).

**Headers:** `Authorization: Bearer <token>`

**Request (Form-based - Preferred):**
```json
{
  "project_name": "Server Rack Procurement",
  "category_id": 5,
  "industry": "Technology",
  "delivery_country": "Ukraine",
  "delivery_city": "Kyiv",
  "delivery_address": "123 Main Street",
  "delivery_window_start": "2026-03-01",
  "delivery_window_end": "2026-03-15",
  "description": "Need 20 server racks with specific dimensions",
  "specifications": "Height: 42U, Width: 600mm, Depth: 1000mm",
  "quantity": 20,
  "quantity_uom": "units",
  "metadata": {
    "certifications_required": ["ISO9001"],
    "warranty_required_months": 24
  }
}
```

**Request (File upload):**
```
Content-Type: multipart/form-data

file: <PDF/Excel file>
project_name: "Server Rack Procurement"
category_id: 5
delivery_country: "Ukraine"
... (other fields)
```

**Response:** `201 Created`
```json
{
  "rfq": {
    "id": 1,
    "rfq_number": "RFQ-2026-0001",
    "project_name": "Server Rack Procurement",
    "status": "draft",
    "buyer_id": 1,
    "category_id": 5,
    "delivery_country": "Ukraine",
    "delivery_window_start": "2026-03-01",
    "delivery_window_end": "2026-03-15",
    "is_normalized": true,
    "normalization_flags": {
      "missing_fields": [],
      "warnings": []
    },
    "created_at": "2026-01-28T10:00:00Z"
  }
}
```

---

### GET /rfqs
List all RFQs for current user.

**Headers:** `Authorization: Bearer <token>`

**Query Params:**
- `status` (optional): Filter by status (draft, open, closed, awarded, cancelled)
- `category_id` (optional): Filter by category
- `page` (default: 1): Pagination
- `limit` (default: 20): Items per page

**Response:** `200 OK`
```json
{
  "rfqs": [
    {
      "id": 1,
      "rfq_number": "RFQ-2026-0001",
      "project_name": "Server Rack Procurement",
      "status": "open",
      "category": {
        "id": 5,
        "name": "IT Equipment"
      },
      "delivery_country": "Ukraine",
      "created_at": "2026-01-28T10:00:00Z",
      "response_deadline": "2026-02-15T23:59:59Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

---

### GET /rfqs/:id
Get single RFQ details.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "rfq": {
    "id": 1,
    "rfq_number": "RFQ-2026-0001",
    "project_name": "Server Rack Procurement",
    "status": "open",
    "buyer": {
      "id": 1,
      "company_name": "Acme Corp"
    },
    "category": {
      "id": 5,
      "name": "IT Equipment"
    },
    "description": "Need 20 server racks...",
    "specifications": "Height: 42U...",
    "quantity": 20,
    "quantity_uom": "units",
    "delivery_country": "Ukraine",
    "delivery_city": "Kyiv",
    "delivery_window_start": "2026-03-01",
    "delivery_window_end": "2026-03-15",
    "metadata": {
      "certifications_required": ["ISO9001"],
      "warranty_required_months": 24
    },
    "normalized_data": { ... },
    "normalization_flags": {
      "missing_fields": [],
      "warnings": []
    },
    "created_at": "2026-01-28T10:00:00Z",
    "response_deadline": "2026-02-15T23:59:59Z"
  }
}
```

---

### PATCH /rfqs/:id
Update RFQ (only if status is 'draft').

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "project_name": "Updated Project Name",
  "delivery_window_end": "2026-03-20"
}
```

**Response:** `200 OK`

---

### POST /rfqs/:id/publish
Publish RFQ (change status from 'draft' to 'open').

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "rfq": {
    "id": 1,
    "status": "open",
    "published_at": "2026-01-28T12:00:00Z"
  }
}
```

---

## Workflow B: Technical Normalization

### GET /rfqs/:id/normalized
Get normalized RFQ data (HTML spec sheet).

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "normalized_data": {
    "basic_info": {
      "rfq_number": "RFQ-2026-0001",
      "project_name": "Server Rack Procurement",
      "category": "IT Equipment"
    },
    "delivery": {
      "country": "Ukraine",
      "city": "Kyiv",
      "window_start": "2026-03-01",
      "window_end": "2026-03-15"
    },
    "specifications": {
      "quantity": 20,
      "uom": "units",
      "dimensions": "42U x 600mm x 1000mm",
      "certifications": ["ISO9001"],
      "warranty": "24 months"
    }
  },
  "html_spec_sheet": "<html>...</html>",
  "validation": {
    "is_complete": true,
    "missing_fields": [],
    "contradictions": [],
    "warnings": []
  }
}
```

---

### POST /rfqs/:id/validate
Validate RFQ data and flag issues.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "is_valid": false,
  "missing_fields": ["warranty_required_months"],
  "contradictions": [],
  "warnings": [
    "Description is short (< 50 characters)"
  ]
}
```

---

## Workflow C: Supplier Matching

### GET /suppliers
List all suppliers (for admin/buyers).

**Headers:** `Authorization: Bearer <token>`

**Query Params:**
- `category_id` (optional): Filter by category
- `country` (optional): Filter by country
- `can_export_to_ukraine` (optional): Boolean filter
- `page`, `limit`: Pagination

**Response:** `200 OK`
```json
{
  "suppliers": [
    {
      "id": 1,
      "company_name": "Tech Supplies Inc",
      "supplier_type": "Distributor",
      "country": "Poland",
      "regions_served": ["Europe", "Asia"],
      "can_export_to_ukraine": true,
      "responsiveness_score": 4,
      "categories": [
        {"id": 5, "name": "IT Equipment"},
        {"id": 8, "name": "Electronics"}
      ]
    }
  ],
  "pagination": { ... }
}
```

---

### POST /suppliers
Create supplier profile (linked to user).

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "company_name": "Tech Supplies Inc",
  "supplier_type": "Distributor",
  "description": "Leading IT equipment distributor",
  "website": "https://techsupplies.com",
  "country": "Poland",
  "city": "Warsaw",
  "regions_served": ["Europe", "Asia"],
  "can_export_to_ukraine": true,
  "category_ids": [5, 8],
  "certifications": ["ISO9001", "AS9100"]
}
```

**Response:** `201 Created`

---

### POST /rfqs/:id/match-suppliers
Match suppliers to RFQ using rule-based algorithm.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "require_ukraine_export": true,
  "max_results": 10
}
```

**Response:** `200 OK`
```json
{
  "matched_suppliers": [
    {
      "supplier_id": 1,
      "company_name": "Tech Supplies Inc",
      "match_score": 180,
      "match_reasons": [
        "category_exact_match",
        "region_match",
        "export_compliance_match"
      ],
      "breakdown": {
        "category_match": 100,
        "region_match": 50,
        "export_compliance": 30,
        "responsiveness": 0
      }
    },
    {
      "supplier_id": 2,
      "company_name": "Global OEM",
      "match_score": 150,
      "match_reasons": [
        "category_exact_match",
        "region_match"
      ],
      "breakdown": {
        "category_match": 100,
        "region_match": 50,
        "export_compliance": 0,
        "responsiveness": 0
      }
    }
  ]
}
```

---

## Workflow D: RFQ Distribution & Tracking

### POST /rfqs/:id/assign
Assign RFQ to selected suppliers.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "supplier_ids": [1, 2, 3],
  "send_email": true
}
```

**Response:** `200 OK`
```json
{
  "assignments": [
    {
      "id": 1,
      "rfq_id": 1,
      "supplier_id": 1,
      "status": "assigned",
      "match_score": 180,
      "assigned_at": "2026-01-28T14:00:00Z"
    },
    {
      "id": 2,
      "rfq_id": 1,
      "supplier_id": 2,
      "status": "assigned",
      "match_score": 150,
      "assigned_at": "2026-01-28T14:00:00Z"
    }
  ]
}
```

---

### GET /rfqs/:id/assignments
Get all supplier assignments for RFQ.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "assignments": [
    {
      "id": 1,
      "supplier": {
        "id": 1,
        "company_name": "Tech Supplies Inc"
      },
      "status": "quoting",
      "assigned_at": "2026-01-28T14:00:00Z",
      "acknowledged_at": "2026-01-29T09:00:00Z",
      "quoting_started_at": "2026-01-29T10:00:00Z"
    }
  ]
}
```

---

### PATCH /rfq-suppliers/:id/status
Update assignment status (supplier endpoint).

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "status": "acknowledged",
  "supplier_notes": "Reviewing requirements"
}
```

**Response:** `200 OK`

**Allowed Status Transitions:**
- `assigned` → `acknowledged`
- `acknowledged` → `quoting`
- `quoting` → `submitted` (auto when quote submitted)
- Any → `declined`

---

### GET /suppliers/rfqs
Get RFQs assigned to current supplier.

**Headers:** `Authorization: Bearer <token>`

**Query Params:**
- `status`: Filter by assignment status
- `page`, `limit`: Pagination

**Response:** `200 OK`
```json
{
  "rfqs": [
    {
      "rfq": {
        "id": 1,
        "rfq_number": "RFQ-2026-0001",
        "project_name": "Server Rack Procurement",
        "buyer_company": "Acme Corp",
        "category": "IT Equipment",
        "response_deadline": "2026-02-15T23:59:59Z"
      },
      "assignment": {
        "id": 1,
        "status": "assigned",
        "assigned_at": "2026-01-28T14:00:00Z"
      }
    }
  ]
}
```

---

## Workflow E: Quote Intake & Normalization

### POST /rfqs/:rfqId/quotes
Submit quote (supplier endpoint).

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "price": 15000.00,
  "currency": "USD",
  "lead_time_weeks": 4,
  "ship_date": "2026-02-25",
  "incoterm": "DDP",
  "payment_terms": "Net 30",
  "scope_description": "Supply and delivery of 20x 42U server racks including installation brackets",
  "inclusions": "Delivery to site, assembly instructions",
  "exclusions": "Installation labor, electrical work",
  "warranty_months": 24,
  "warranty_description": "Manufacturer warranty covering defects",
  "valid_until": "2026-03-15",
  "notes": "Can expedite to 3 weeks for additional fee"
}
```

**Response:** `201 Created`
```json
{
  "quote": {
    "id": 1,
    "rfq_id": 1,
    "supplier_id": 1,
    "price": 15000.00,
    "currency": "USD",
    "ship_date": "2026-02-25",
    "incoterm": "DDP",
    "warranty_months": 24,
    "valid_until": "2026-03-15",
    "status": "submitted",
    "submitted_at": "2026-01-30T10:00:00Z"
  }
}
```

---

### GET /rfqs/:id/quotes
Get all quotes for RFQ (buyer endpoint).

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "quotes": [
    {
      "id": 1,
      "supplier": {
        "id": 1,
        "company_name": "Tech Supplies Inc"
      },
      "price": 15000.00,
      "currency": "USD",
      "ship_date": "2026-02-25",
      "incoterm": "DDP",
      "scope_description": "Supply and delivery...",
      "warranty_months": 24,
      "valid_until": "2026-03-15",
      "submitted_at": "2026-01-30T10:00:00Z"
    }
  ]
}
```

---

### PATCH /quotes/:id
Edit quote fields (buyer only).

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "price": 14500.00,
  "notes": "Negotiated price reduction"
}
```

**Response:** `200 OK`
```json
{
  "quote": { ... },
  "is_edited_by_buyer": true
}
```

---

## Workflow F: Quote Comparison Dashboard

### GET /rfqs/:id/compare
Get quote comparison data with analysis.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "rfq": {
    "id": 1,
    "rfq_number": "RFQ-2026-0001",
    "project_name": "Server Rack Procurement"
  },
  "quotes": [
    {
      "id": 1,
      "supplier_name": "Tech Supplies Inc",
      "price": 15000.00,
      "currency": "USD",
      "ship_date": "2026-02-25",
      "lead_time_days": 28,
      "incoterm": "DDP",
      "warranty_months": 24,
      "valid_until": "2026-03-15",
      "scope_description": "...",
      "risk_flags": [],
      "rankings": {
        "price_rank": 2,
        "lead_time_rank": 1,
        "balanced_rank": 1
      },
      "scores": {
        "normalized_price_score": 75,
        "normalized_lead_time_score": 100,
        "balanced_score": 85
      }
    },
    {
      "id": 2,
      "supplier_name": "Global OEM",
      "price": 14000.00,
      "currency": "USD",
      "ship_date": "2026-03-10",
      "lead_time_days": 41,
      "incoterm": "FOB",
      "warranty_months": 12,
      "valid_until": "2026-02-28",
      "scope_description": "...",
      "risk_flags": [
        {
          "type": "expired_validity",
          "severity": "high",
          "message": "Quote validity expires in 3 days"
        },
        {
          "type": "short_warranty",
          "severity": "medium",
          "message": "Warranty is only 12 months"
        }
      ],
      "rankings": {
        "price_rank": 1,
        "lead_time_rank": 2,
        "balanced_rank": 2
      },
      "scores": {
        "normalized_price_score": 100,
        "normalized_lead_time_score": 60,
        "balanced_score": 84
      }
    }
  ],
  "analysis": {
    "best_price": {
      "quote_id": 2,
      "value": 14000.00
    },
    "fastest_ship": {
      "quote_id": 1,
      "date": "2026-02-25"
    },
    "balanced_option": {
      "quote_id": 1,
      "score": 85
    },
    "total_quotes": 2,
    "price_range": {
      "min": 14000.00,
      "max": 15000.00,
      "currency": "USD"
    }
  }
}
```

---

### GET /rfqs/:id/export
Export quote comparison to CSV.

**Headers:** `Authorization: Bearer <token>`

**Query Params:**
- `format`: `csv` or `excel` (future)

**Response:** `200 OK`
```
Content-Type: text/csv
Content-Disposition: attachment; filename="RFQ-2026-0001-comparison.csv"

Supplier,Price,Currency,Ship Date,Lead Time (days),Incoterm,Warranty (months),Valid Until,Price Rank,Lead Time Rank
Tech Supplies Inc,15000.00,USD,2026-02-25,28,DDP,24,2026-03-15,2,1
Global OEM,14000.00,USD,2026-03-10,41,FOB,12,2026-02-28,1,2
```

---

## Workflow G: Inventory R2D

### POST /vendors
Create vendor profile (admin only).

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "name": "Parts Warehouse Ltd",
  "vendor_code": "PARTSWH",
  "contact_email": "inventory@partswarehouse.com",
  "feed_type": "scheduled_file",
  "feed_schedule": "daily"
}
```

**Response:** `201 Created`

---

### POST /vendors/:id/inventory/upload
Upload inventory CSV/XLSX.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```
Content-Type: multipart/form-data

file: <CSV/XLSX file>
```

**CSV Format:**
```csv
vendor_sku,oem,mpn,model,category,description,qty_available,qty_uom,status,ship_from_location,ship_from_country,earliest_ship_date,condition
SKU-001,Dell,R740XD,PowerEdge R740XD,Servers,"Dell server 2U",5,units,available,"Warsaw",Poland,2026-01-30,new
```

**Response:** `200 OK`
```json
{
  "imported": 150,
  "updated": 20,
  "errors": 2,
  "error_details": [
    {
      "row": 5,
      "error": "Invalid date format for earliest_ship_date"
    }
  ]
}
```

---

### GET /inventory
Search inventory with R2D filters.

**Headers:** `Authorization: Bearer <token>`

**Query Params:**
- `category_id`: Filter by category
- `r2d_tier`: Filter by tier (0, 1, 2)
- `min_confidence`: Minimum confidence score (0.0-1.0)
- `search`: Keyword search (MPN, description)
- `ship_from_country`: Filter by location
- `condition`: Filter by condition
- `page`, `limit`: Pagination

**Response:** `200 OK`
```json
{
  "items": [
    {
      "id": 1,
      "vendor": {
        "id": 1,
        "name": "Parts Warehouse Ltd"
      },
      "vendor_sku": "SKU-001",
      "oem": "Dell",
      "mpn": "R740XD",
      "description": "Dell server 2U",
      "category": {
        "id": 10,
        "name": "Servers"
      },
      "qty_available": 5,
      "qty_uom": "units",
      "status": "available",
      "ship_from_location": "Warsaw, Poland",
      "earliest_ship_date": "2026-01-30",
      "r2d_tier": 0,
      "business_days_to_ship": 2,
      "condition": "new",
      "last_verified": "2026-01-28T08:00:00Z",
      "verification_method": "scheduled_file",
      "confidence_score": 0.7,
      "hours_since_verified": 12,
      "expires_at": "2026-01-31T08:00:00Z"
    }
  ],
  "pagination": { ... },
  "summary": {
    "r2d_0_count": 45,
    "r2d_1_count": 120,
    "r2d_2_count": 80,
    "total_items": 245
  }
}
```

---

### GET /inventory/:id
Get single inventory item details.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

---

## Workflow H: Procurement Recommendations

### POST /rfqs/:id/recommend
Generate recommendations for RFQ.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "price_weight": 0.6,
  "lead_time_weight": 0.4,
  "top_n": 3
}
```

**Response:** `200 OK`
```json
{
  "recommendation": {
    "id": 1,
    "rfq_id": 1,
    "recommended_quotes": [
      {
        "quote_id": 1,
        "rank": 1,
        "reason": "balanced",
        "score": 85,
        "summary": "Best overall option balancing price and lead time",
        "supplier_name": "Tech Supplies Inc",
        "price": 15000.00,
        "ship_date": "2026-02-25"
      },
      {
        "quote_id": 2,
        "rank": 2,
        "reason": "best_price",
        "score": 84,
        "summary": "Lowest price but longer lead time",
        "supplier_name": "Global OEM",
        "price": 14000.00,
        "ship_date": "2026-03-10"
      }
    ],
    "algorithm_version": "rule_based_v1",
    "created_at": "2026-01-30T15:00:00Z"
  }
}
```

---

### GET /rfqs/:id/recommendations
Get existing recommendations.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

---

### PATCH /recommendations/:id
Update buyer notes on recommendation.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "buyer_notes": "Prefer supplier 1 due to better warranty terms",
  "is_reviewed": true
}
```

**Response:** `200 OK`

---

## Admin Endpoints

### GET /admin/users
List all users (admin only).

### GET /admin/stats
Get platform statistics.

**Response:**
```json
{
  "total_rfqs": 150,
  "active_rfqs": 25,
  "total_quotes": 450,
  "total_suppliers": 80,
  "total_buyers": 30,
  "avg_quotes_per_rfq": 3.0,
  "avg_response_time_hours": 48
}
```

---

## Supporting Endpoints

### GET /categories
Get all categories (public).

**Response:** `200 OK`
```json
{
  "categories": [
    {
      "id": 1,
      "name": "IT Equipment",
      "slug": "it-equipment",
      "is_high_velocity": false,
      "children": [
        {"id": 10, "name": "Servers"},
        {"id": 11, "name": "Networking"}
      ]
    }
  ]
}
```

---

### GET /notifications
Get user notifications.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "notifications": [
    {
      "id": 1,
      "type": "quote_submitted",
      "title": "New quote received",
      "message": "Tech Supplies Inc submitted a quote for RFQ-2026-0001",
      "rfq_id": 1,
      "quote_id": 1,
      "is_read": false,
      "created_at": "2026-01-30T10:00:00Z"
    }
  ]
}
```

---

### PATCH /notifications/:id/read
Mark notification as read.

---

## Error Responses

### Standard Error Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "price",
        "message": "Price must be greater than 0"
      }
    ]
  }
}
```

### Error Codes
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `422` - Unprocessable Entity (business logic error)
- `500` - Internal Server Error

---

## Rate Limiting

- **Authenticated requests**: 1000 requests/hour
- **File uploads**: 100 requests/hour
- **Unauthenticated**: 100 requests/hour

**Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1643385600
```

---

## Pagination

All list endpoints support pagination:

**Request:**
```
GET /api/v1/rfqs?page=2&limit=20
```

**Response Headers:**
```
X-Total-Count: 150
X-Page: 2
X-Per-Page: 20
X-Total-Pages: 8
```

---

## File Uploads

### Supported Formats
- **RFQ Upload**: PDF, XLSX, XLS, TXT (max 10MB)
- **Quote Attachments**: PDF, XLSX, DOCX (max 5MB)
- **Inventory Upload**: CSV, XLSX (max 50MB)

### Storage
- Development: Local filesystem (`/uploads`)
- Production: S3-compatible storage

---

## WebSocket Events (Phase 2)

Future real-time updates:

```javascript
// Subscribe to RFQ updates
socket.emit('subscribe', { rfq_id: 1 })

// Receive events
socket.on('quote_submitted', (data) => { ... })
socket.on('status_changed', (data) => { ... })
```

---

## Webhooks (Phase 2)

Allow external systems to receive events:

```
POST https://customer-system.com/webhooks/rfq-events
{
  "event": "quote.submitted",
  "data": { ... },
  "timestamp": "2026-01-30T10:00:00Z"
}
```

---

## API Versioning

- Current version: `v1`
- Version in URL: `/api/v1/...`
- Deprecation notice: 6 months before removal
- Breaking changes: New version (v2, v3, etc.)

---

## Next Steps

1. Implement Express routes
2. Add request validation (Joi/Zod)
3. Implement authentication middleware (JWT)
4. Add authorization checks (role-based)
5. Create API documentation (Swagger/OpenAPI)
6. Write integration tests
