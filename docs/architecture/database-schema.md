# Database Schema Design

## Overview
PostgreSQL database with relational tables for structured data and JSONB columns for flexible metadata.

---

## Entity Relationship Diagram (Text)

```
users (buyers, suppliers, admins)
  ↓
rfqs (request for quotes)
  ↓
rfq_suppliers (many-to-many: rfq assignments)
  ↓
quotes (supplier responses)

suppliers (supplier profiles)
  ↓
supplier_categories (many-to-many)
  ↓
categories (product/service categories)

vendors (inventory providers)
  ↓
inventory_items (R2D tracking)
```

---

## Core Tables

### 1. users
User accounts for buyers, suppliers, and admins.

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'buyer', 'supplier', 'admin'
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  company_name VARCHAR(255),
  phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

---

### 2. categories
Product/service categories for RFQ classification.

```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  parent_id INTEGER REFERENCES categories(id), -- for hierarchical categories
  description TEXT,
  is_high_velocity BOOLEAN DEFAULT false, -- for R2D freshness rules
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);
```

**Sample Data:**
- Electronics → Semiconductors (high velocity)
- Industrial → Fasteners (high velocity)
- Medical → PPE (high velocity)
- Construction → Materials
- Office → Furniture

---

### 3. suppliers
Supplier/vendor profiles.

```sql
CREATE TABLE suppliers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  supplier_type VARCHAR(50), -- 'OEM', 'Distributor', 'Reseller'
  description TEXT,
  website VARCHAR(255),

  -- Contact info
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),

  -- Location
  country VARCHAR(100),
  city VARCHAR(100),
  address TEXT,

  -- Capabilities
  regions_served JSONB, -- ['North America', 'Europe', 'Asia']

  -- Compliance
  can_export_to_ukraine BOOLEAN DEFAULT false,
  certifications JSONB, -- ['ISO9001', 'AS9100', etc.]

  -- Performance metrics
  responsiveness_score INTEGER DEFAULT 3, -- 1-5 scale
  average_response_time_hours INTEGER,
  total_rfqs_received INTEGER DEFAULT 0,
  total_quotes_submitted INTEGER DEFAULT 0,
  quote_submission_rate DECIMAL(5,2), -- percentage

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_suppliers_user_id ON suppliers(user_id);
CREATE INDEX idx_suppliers_type ON suppliers(supplier_type);
CREATE INDEX idx_suppliers_country ON suppliers(country);
CREATE INDEX idx_suppliers_active ON suppliers(is_active);
```

---

### 4. supplier_categories
Many-to-many relationship between suppliers and categories.

```sql
CREATE TABLE supplier_categories (
  id SERIAL PRIMARY KEY,
  supplier_id INTEGER REFERENCES suppliers(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(supplier_id, category_id)
);

CREATE INDEX idx_supplier_categories_supplier ON supplier_categories(supplier_id);
CREATE INDEX idx_supplier_categories_category ON supplier_categories(category_id);
```

---

### 5. rfqs
Request for Quote records.

```sql
CREATE TABLE rfqs (
  id SERIAL PRIMARY KEY,
  buyer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

  -- Basic info
  rfq_number VARCHAR(50) UNIQUE NOT NULL, -- auto-generated: RFQ-2026-0001
  project_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'open', 'closed', 'awarded', 'cancelled'

  -- Classification
  category_id INTEGER REFERENCES categories(id),
  industry VARCHAR(100),

  -- Delivery requirements
  delivery_country VARCHAR(100) NOT NULL,
  delivery_city VARCHAR(100),
  delivery_address TEXT,
  delivery_window_start DATE,
  delivery_window_end DATE,

  -- RFQ details
  description TEXT NOT NULL,
  specifications TEXT,
  quantity DECIMAL(10,2),
  quantity_uom VARCHAR(50), -- 'pieces', 'kg', 'units', etc.

  -- Metadata (flexible JSONB for varying requirements)
  metadata JSONB, -- technical specs, custom fields, etc.

  -- Normalization
  normalized_data JSONB, -- machine-readable structured data
  is_normalized BOOLEAN DEFAULT false,
  normalization_flags JSONB, -- missing fields, contradictions

  -- Files
  original_file_path VARCHAR(500),
  original_file_name VARCHAR(255),
  original_file_type VARCHAR(50), -- 'pdf', 'excel', 'text'

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP,
  closed_at TIMESTAMP,
  response_deadline TIMESTAMP,

  -- Notes
  buyer_notes TEXT
);

CREATE INDEX idx_rfqs_buyer ON rfqs(buyer_id);
CREATE INDEX idx_rfqs_number ON rfqs(rfq_number);
CREATE INDEX idx_rfqs_status ON rfqs(status);
CREATE INDEX idx_rfqs_category ON rfqs(category_id);
CREATE INDEX idx_rfqs_delivery_country ON rfqs(delivery_country);
CREATE INDEX idx_rfqs_created ON rfqs(created_at DESC);
```

**Normalized Data JSONB Example:**
```json
{
  "technical_specs": {
    "voltage": "220V",
    "power": "1500W",
    "dimensions": "50x30x20cm"
  },
  "certifications_required": ["CE", "RoHS"],
  "warranty_required_months": 24,
  "payment_terms": "Net 30"
}
```

---

### 6. rfq_suppliers
Many-to-many relationship tracking RFQ assignments to suppliers.

```sql
CREATE TABLE rfq_suppliers (
  id SERIAL PRIMARY KEY,
  rfq_id INTEGER REFERENCES rfqs(id) ON DELETE CASCADE,
  supplier_id INTEGER REFERENCES suppliers(id) ON DELETE CASCADE,

  -- Status tracking (Workflow D)
  status VARCHAR(50) DEFAULT 'assigned',
  -- 'assigned', 'acknowledged', 'quoting', 'submitted', 'declined'

  -- Matching score
  match_score INTEGER, -- rule-based score from supplier matching
  match_reasons JSONB, -- ['category_match', 'region_match', 'compliance_match']

  -- Timestamps
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  acknowledged_at TIMESTAMP,
  quoting_started_at TIMESTAMP,
  submitted_at TIMESTAMP,
  declined_at TIMESTAMP,

  -- Reminders
  last_reminder_sent TIMESTAMP,
  reminder_count INTEGER DEFAULT 0,

  -- Notes
  supplier_notes TEXT,
  buyer_notes TEXT,

  UNIQUE(rfq_id, supplier_id)
);

CREATE INDEX idx_rfq_suppliers_rfq ON rfq_suppliers(rfq_id);
CREATE INDEX idx_rfq_suppliers_supplier ON rfq_suppliers(supplier_id);
CREATE INDEX idx_rfq_suppliers_status ON rfq_suppliers(status);
```

---

### 7. quotes
Supplier quote submissions.

```sql
CREATE TABLE quotes (
  id SERIAL PRIMARY KEY,
  rfq_supplier_id INTEGER REFERENCES rfq_suppliers(id) ON DELETE CASCADE,
  rfq_id INTEGER REFERENCES rfqs(id) ON DELETE CASCADE,
  supplier_id INTEGER REFERENCES suppliers(id) ON DELETE CASCADE,

  -- Quote details (Workflow E - normalized fields)
  price DECIMAL(12,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD', -- 'USD', 'EUR', 'UAH', etc.

  -- Lead time
  lead_time_weeks INTEGER,
  ship_date DATE,

  -- Terms
  incoterm VARCHAR(10), -- 'EXW', 'FOB', 'CIF', 'DDP', etc.
  payment_terms VARCHAR(100),

  -- Scope
  scope_description TEXT,
  inclusions TEXT,
  exclusions TEXT,

  -- Warranty
  warranty_months INTEGER,
  warranty_description TEXT,

  -- Validity
  valid_until DATE NOT NULL,

  -- Additional details
  notes TEXT,
  metadata JSONB, -- flexible for additional fields

  -- Files
  attachment_path VARCHAR(500),
  attachment_name VARCHAR(255),

  -- Status
  status VARCHAR(50) DEFAULT 'submitted', -- 'submitted', 'withdrawn', 'awarded', 'rejected'
  is_edited_by_buyer BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quotes_rfq ON quotes(rfq_id);
CREATE INDEX idx_quotes_supplier ON quotes(supplier_id);
CREATE INDEX idx_quotes_rfq_supplier ON quotes(rfq_supplier_id);
CREATE INDEX idx_quotes_price ON quotes(price);
CREATE INDEX idx_quotes_ship_date ON quotes(ship_date);
CREATE INDEX idx_quotes_status ON quotes(status);
```

---

### 8. vendors
Inventory vendors (separate from suppliers for R2D workflow).

```sql
CREATE TABLE vendors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  vendor_code VARCHAR(100) UNIQUE,

  -- Contact
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),

  -- Integration
  api_endpoint VARCHAR(500),
  api_key_hash VARCHAR(255),
  feed_type VARCHAR(50), -- 'api', 'scheduled_file', 'manual'
  feed_schedule VARCHAR(100), -- 'hourly', 'daily', 'weekly'

  -- Performance
  last_sync_at TIMESTAMP,
  total_items INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_vendors_code ON vendors(vendor_code);
CREATE INDEX idx_vendors_active ON vendors(is_active);
```

---

### 9. inventory_items
Ready-to-Deliver (R2D) inventory tracking (Workflow G).

```sql
CREATE TABLE inventory_items (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,

  -- Product identification
  vendor_sku VARCHAR(255) NOT NULL,
  oem VARCHAR(255), -- original equipment manufacturer
  mpn VARCHAR(255), -- manufacturer part number
  model VARCHAR(255),

  -- Classification
  category_id INTEGER REFERENCES categories(id),
  description TEXT NOT NULL,

  -- Availability
  qty_available DECIMAL(10,2) NOT NULL,
  qty_uom VARCHAR(50) DEFAULT 'units', -- 'units', 'pieces', 'kg', etc.
  status VARCHAR(50) DEFAULT 'available', -- 'available', 'reserved', 'sold', 'unknown'

  -- Shipping
  ship_from_location VARCHAR(255),
  ship_from_country VARCHAR(100),
  earliest_ship_date DATE NOT NULL,

  -- R2D tier calculation
  r2d_tier INTEGER, -- 0, 1, 2 (calculated from earliest_ship_date)
  business_days_to_ship INTEGER, -- calculated field

  -- Condition
  condition VARCHAR(50) DEFAULT 'new', -- 'new', 'surplus_new', 'refurbished', 'used'

  -- Verification & Freshness
  last_verified TIMESTAMP NOT NULL,
  verification_method VARCHAR(50) NOT NULL, -- 'api_feed', 'scheduled_file', 'manual', 'stale'
  confidence_score DECIMAL(3,2), -- 0.2, 0.5, 0.7, 0.9

  -- Pricing (optional)
  price DECIMAL(12,2),
  currency VARCHAR(10),

  -- Metadata
  metadata JSONB, -- additional specs, certifications, etc.

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Expiry
  expires_at TIMESTAMP, -- auto-calculated: 72h or 14d based on category
  is_expired BOOLEAN DEFAULT false,

  UNIQUE(vendor_id, vendor_sku)
);

CREATE INDEX idx_inventory_vendor ON inventory_items(vendor_id);
CREATE INDEX idx_inventory_category ON inventory_items(category_id);
CREATE INDEX idx_inventory_r2d_tier ON inventory_items(r2d_tier);
CREATE INDEX idx_inventory_ship_date ON inventory_items(earliest_ship_date);
CREATE INDEX idx_inventory_status ON inventory_items(status);
CREATE INDEX idx_inventory_expired ON inventory_items(is_expired);
CREATE INDEX idx_inventory_mpn ON inventory_items(mpn);
CREATE INDEX idx_inventory_confidence ON inventory_items(confidence_score);
```

**R2D Tier Calculation Logic:**
- R2D-0: 0-3 business days → `r2d_tier = 0`
- R2D-1: 4-10 business days → `r2d_tier = 1`
- R2D-2: 11-30 business days → `r2d_tier = 2`

**Confidence Score Mapping:**
- API feed: 0.9
- Scheduled file: 0.7
- Manual confirmation: 0.5
- Stale (not updated): 0.2

---

### 10. recommendations
Procurement recommendation records (Workflow H).

```sql
CREATE TABLE recommendations (
  id SERIAL PRIMARY KEY,
  rfq_id INTEGER REFERENCES rfqs(id) ON DELETE CASCADE,

  -- Top recommendations (JSON array of quote IDs with reasons)
  recommended_quotes JSONB NOT NULL,
  -- Example: [
  --   {"quote_id": 123, "rank": 1, "reason": "best_price", "score": 95},
  --   {"quote_id": 456, "rank": 2, "reason": "fastest_ship", "score": 88},
  --   {"quote_id": 789, "rank": 3, "reason": "balanced", "score": 85}
  -- ]

  -- Algorithm version
  algorithm_version VARCHAR(50) DEFAULT 'rule_based_v1',

  -- Buyer notes
  buyer_notes TEXT,

  -- Status
  is_reviewed BOOLEAN DEFAULT false,
  reviewed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recommendations_rfq ON recommendations(rfq_id);
```

---

## Supporting Tables

### 11. audit_log
Track all important changes for compliance.

```sql
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  entity_type VARCHAR(50), -- 'rfq', 'quote', 'supplier', etc.
  entity_id INTEGER,
  action VARCHAR(50), -- 'create', 'update', 'delete', 'status_change'
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);
```

---

### 12. notifications
Email/in-app notification queue.

```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50), -- 'rfq_assigned', 'quote_submitted', 'reminder', etc.
  title VARCHAR(255),
  message TEXT,

  -- Related entities
  rfq_id INTEGER REFERENCES rfqs(id) ON DELETE CASCADE,
  quote_id INTEGER REFERENCES quotes(id) ON DELETE CASCADE,

  -- Delivery
  is_read BOOLEAN DEFAULT false,
  is_sent_email BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);
```

---

## Database Functions & Triggers

### Auto-update `updated_at` timestamp

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rfqs_updated_at BEFORE UPDATE ON rfqs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- (repeat for other tables)
```

---

### Calculate R2D tier on insert/update

```sql
CREATE OR REPLACE FUNCTION calculate_r2d_tier()
RETURNS TRIGGER AS $$
DECLARE
  days_diff INTEGER;
BEGIN
  -- Calculate business days from today to earliest_ship_date
  days_diff := NEW.earliest_ship_date - CURRENT_DATE;

  -- Assign R2D tier
  IF days_diff <= 3 THEN
    NEW.r2d_tier := 0;
  ELSIF days_diff <= 10 THEN
    NEW.r2d_tier := 1;
  ELSIF days_diff <= 30 THEN
    NEW.r2d_tier := 2;
  ELSE
    NEW.r2d_tier := NULL; -- Not R2D eligible
  END IF;

  NEW.business_days_to_ship := days_diff;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_r2d_tier_trigger BEFORE INSERT OR UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION calculate_r2d_tier();
```

---

### Calculate confidence score

```sql
CREATE OR REPLACE FUNCTION calculate_confidence_score()
RETURNS TRIGGER AS $$
BEGIN
  CASE NEW.verification_method
    WHEN 'api_feed' THEN NEW.confidence_score := 0.9;
    WHEN 'scheduled_file' THEN NEW.confidence_score := 0.7;
    WHEN 'manual' THEN NEW.confidence_score := 0.5;
    WHEN 'stale' THEN NEW.confidence_score := 0.2;
    ELSE NEW.confidence_score := 0.2;
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_confidence_trigger BEFORE INSERT OR UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION calculate_confidence_score();
```

---

### Auto-expire stale inventory

```sql
CREATE OR REPLACE FUNCTION calculate_inventory_expiry()
RETURNS TRIGGER AS $$
DECLARE
  is_high_velocity BOOLEAN;
  expiry_hours INTEGER;
BEGIN
  -- Check if category is high velocity
  SELECT c.is_high_velocity INTO is_high_velocity
  FROM categories c
  WHERE c.id = NEW.category_id;

  -- Set expiry time
  IF is_high_velocity THEN
    expiry_hours := 72; -- 72 hours for high velocity
  ELSE
    expiry_hours := 336; -- 14 days (336 hours) for others
  END IF;

  NEW.expires_at := NEW.last_verified + (expiry_hours || ' hours')::INTERVAL;

  -- Mark as expired if past expiry
  IF NEW.expires_at < CURRENT_TIMESTAMP THEN
    NEW.is_expired := true;
    NEW.verification_method := 'stale';
  ELSE
    NEW.is_expired := false;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_expiry_trigger BEFORE INSERT OR UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION calculate_inventory_expiry();
```

---

## Indexes Summary

### Performance-Critical Indexes
- User lookups: `idx_users_email`, `idx_users_role`
- RFQ searches: `idx_rfqs_buyer`, `idx_rfqs_status`, `idx_rfqs_category`
- Supplier matching: `idx_supplier_categories_category`, `idx_suppliers_country`
- Quote comparison: `idx_quotes_rfq`, `idx_quotes_price`, `idx_quotes_ship_date`
- Inventory R2D: `idx_inventory_r2d_tier`, `idx_inventory_ship_date`, `idx_inventory_expired`

---

## Sample Queries

### Find matching suppliers for RFQ
```sql
SELECT s.*, sc.category_id, COUNT(*) as category_matches
FROM suppliers s
JOIN supplier_categories sc ON s.id = sc.supplier_id
WHERE sc.category_id = $category_id
  AND s.is_active = true
  AND (s.regions_served @> '["North America"]' OR s.regions_served IS NULL)
GROUP BY s.id, sc.category_id
ORDER BY category_matches DESC;
```

### Get R2D-0 inventory for category
```sql
SELECT i.*, v.name as vendor_name,
  EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - i.last_verified))/3600 as hours_since_verified
FROM inventory_items i
JOIN vendors v ON i.vendor_id = v.id
WHERE i.category_id = $category_id
  AND i.r2d_tier = 0
  AND i.is_expired = false
  AND i.status = 'available'
ORDER BY i.confidence_score DESC, i.earliest_ship_date ASC;
```

### Compare quotes for RFQ
```sql
SELECT q.*, s.company_name as supplier_name,
  RANK() OVER (ORDER BY q.price ASC) as price_rank,
  RANK() OVER (ORDER BY q.ship_date ASC) as lead_time_rank
FROM quotes q
JOIN suppliers s ON q.supplier_id = s.id
WHERE q.rfq_id = $rfq_id
  AND q.status = 'submitted'
ORDER BY q.price ASC;
```

---

## Migration Strategy

### Phase 1: Core Tables
1. users, categories
2. suppliers, supplier_categories
3. rfqs, rfq_suppliers
4. quotes

### Phase 2: Inventory Tables
5. vendors
6. inventory_items

### Phase 3: Supporting Tables
7. recommendations
8. audit_log
9. notifications

### Phase 4: Functions & Triggers
10. Triggers for updated_at
11. R2D tier calculation
12. Confidence scoring
13. Expiry calculation

---

## Backup & Maintenance

### Daily Backups
```bash
pg_dump rfq_platform > backup_$(date +%Y%m%d).sql
```

### Cleanup Stale Data
```sql
-- Mark expired inventory
UPDATE inventory_items
SET is_expired = true, verification_method = 'stale'
WHERE expires_at < CURRENT_TIMESTAMP AND is_expired = false;

-- Archive old RFQs (older than 1 year)
-- Move to rfqs_archive table
```

---

## Next Steps
1. Create migration files (using Prisma or raw SQL)
2. Set up database connection in Express backend
3. Create ORM models (Prisma recommended)
4. Write seed data for development
