-- RFQ Management Platform - Database Migration
-- Created for Supabase PostgreSQL
-- Run this in Supabase SQL Editor
-- Safe to re-run: uses IF NOT EXISTS everywhere

-- Enable UUID extension (if needed)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Update trigger function (created once)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ---------------------------------------------------------------
-- 1. Users table
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('buyer', 'supplier', 'admin')),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company_name VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ---------------------------------------------------------------
-- 2. Categories table
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    description TEXT,
    is_high_velocity BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- ---------------------------------------------------------------
-- 3. Suppliers table
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    supplier_type VARCHAR(50) CHECK (supplier_type IN ('OEM', 'Distributor', 'Reseller')),
    description TEXT,
    website VARCHAR(500),
    contact_name VARCHAR(100),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    country VARCHAR(100),
    city VARCHAR(100),
    address TEXT,
    regions_served JSONB,
    can_export_to_ukraine BOOLEAN DEFAULT FALSE,
    certifications JSONB,
    responsiveness_score INTEGER DEFAULT 3 CHECK (responsiveness_score BETWEEN 1 AND 5),
    average_response_time_hours INTEGER,
    total_rfqs_received INTEGER DEFAULT 0,
    total_quotes_submitted INTEGER DEFAULT 0,
    quote_submission_rate DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_type ON suppliers(supplier_type);
CREATE INDEX IF NOT EXISTS idx_suppliers_country ON suppliers(country);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(is_active);

-- ---------------------------------------------------------------
-- 4. Supplier-Categories junction table
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS supplier_categories (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(supplier_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_supplier_categories_supplier ON supplier_categories(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_categories_category ON supplier_categories(category_id);

-- ---------------------------------------------------------------
-- 5. RFQs table
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rfqs (
    id SERIAL PRIMARY KEY,
    buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rfq_number VARCHAR(100) UNIQUE NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed', 'awarded', 'cancelled')),
    category_id INTEGER REFERENCES categories(id),
    industry VARCHAR(100),
    delivery_country VARCHAR(100) NOT NULL,
    delivery_city VARCHAR(100),
    delivery_address TEXT,
    delivery_window_start TIMESTAMP,
    delivery_window_end TIMESTAMP,
    description TEXT NOT NULL,
    specifications TEXT,
    quantity DECIMAL(10,2),
    quantity_uom VARCHAR(50),
    metadata JSONB,
    normalized_data JSONB,
    is_normalized BOOLEAN DEFAULT FALSE,
    normalization_flags JSONB,
    original_file_path VARCHAR(500),
    original_file_name VARCHAR(255),
    original_file_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    closed_at TIMESTAMP,
    response_deadline TIMESTAMP,
    buyer_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_rfqs_buyer ON rfqs(buyer_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_number ON rfqs(rfq_number);
CREATE INDEX IF NOT EXISTS idx_rfqs_status ON rfqs(status);
CREATE INDEX IF NOT EXISTS idx_rfqs_category ON rfqs(category_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_country ON rfqs(delivery_country);
CREATE INDEX IF NOT EXISTS idx_rfqs_created ON rfqs(created_at DESC);

-- ---------------------------------------------------------------
-- 6. RFQ-Supplier assignments table
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rfq_suppliers (
    id SERIAL PRIMARY KEY,
    rfq_id INTEGER NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'assigned' CHECK (status IN ('assigned', 'acknowledged', 'quoting', 'submitted', 'declined')),
    match_score INTEGER,
    match_reasons JSONB,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP,
    quoting_started_at TIMESTAMP,
    submitted_at TIMESTAMP,
    declined_at TIMESTAMP,
    last_reminder_sent TIMESTAMP,
    reminder_count INTEGER DEFAULT 0,
    supplier_notes TEXT,
    buyer_notes TEXT,
    UNIQUE(rfq_id, supplier_id)
);

CREATE INDEX IF NOT EXISTS idx_rfq_suppliers_rfq ON rfq_suppliers(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_suppliers_supplier ON rfq_suppliers(supplier_id);
CREATE INDEX IF NOT EXISTS idx_rfq_suppliers_status ON rfq_suppliers(status);

-- ---------------------------------------------------------------
-- 7. Quotes table
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quotes (
    id SERIAL PRIMARY KEY,
    rfq_supplier_id INTEGER NOT NULL REFERENCES rfq_suppliers(id) ON DELETE CASCADE,
    rfq_id INTEGER NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    price DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    lead_time_weeks INTEGER,
    ship_date TIMESTAMP,
    incoterm VARCHAR(20),
    payment_terms VARCHAR(255),
    scope_description TEXT,
    inclusions TEXT,
    exclusions TEXT,
    warranty_months INTEGER,
    warranty_description TEXT,
    valid_until TIMESTAMP NOT NULL,
    notes TEXT,
    metadata JSONB,
    attachment_path VARCHAR(500),
    attachment_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'submitted' CHECK (status IN ('submitted', 'withdrawn', 'awarded', 'rejected')),
    is_edited_by_buyer BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quotes_rfq ON quotes(rfq_id);
CREATE INDEX IF NOT EXISTS idx_quotes_supplier ON quotes(supplier_id);
CREATE INDEX IF NOT EXISTS idx_quotes_rfq_supplier ON quotes(rfq_supplier_id);
CREATE INDEX IF NOT EXISTS idx_quotes_price ON quotes(price);
CREATE INDEX IF NOT EXISTS idx_quotes_ship_date ON quotes(ship_date);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);

-- ---------------------------------------------------------------
-- 8. Vendors table
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vendors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    vendor_code VARCHAR(100) UNIQUE,
    contact_name VARCHAR(100),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    api_endpoint VARCHAR(500),
    api_key_hash VARCHAR(255),
    feed_type VARCHAR(50) CHECK (feed_type IN ('api', 'scheduled_file', 'manual')),
    feed_schedule VARCHAR(100),
    last_sync_at TIMESTAMP,
    total_items INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_vendors_code ON vendors(vendor_code);
CREATE INDEX IF NOT EXISTS idx_vendors_active ON vendors(is_active);

-- ---------------------------------------------------------------
-- 9. Inventory Items table
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_items (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    vendor_sku VARCHAR(255) NOT NULL,
    oem VARCHAR(255),
    mpn VARCHAR(255),
    model VARCHAR(255),
    category_id INTEGER REFERENCES categories(id),
    description TEXT NOT NULL,
    qty_available DECIMAL(10,2) NOT NULL,
    qty_uom VARCHAR(50) DEFAULT 'units',
    status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'unknown')),
    ship_from_location VARCHAR(255),
    ship_from_country VARCHAR(100),
    earliest_ship_date TIMESTAMP NOT NULL,
    r2d_tier INTEGER CHECK (r2d_tier IN (0, 1, 2)),
    business_days_to_ship INTEGER,
    condition VARCHAR(50) DEFAULT 'new' CHECK (condition IN ('new', 'surplus_new', 'refurbished', 'used')),
    last_verified TIMESTAMP NOT NULL,
    verification_method VARCHAR(50) NOT NULL CHECK (verification_method IN ('api_feed', 'scheduled_file', 'manual', 'stale')),
    confidence_score DECIMAL(3,2),
    price DECIMAL(12,2),
    currency VARCHAR(10),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_expired BOOLEAN DEFAULT FALSE,
    UNIQUE(vendor_id, vendor_sku)
);

CREATE INDEX IF NOT EXISTS idx_inventory_vendor ON inventory_items(vendor_id);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory_items(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_r2d_tier ON inventory_items(r2d_tier);
CREATE INDEX IF NOT EXISTS idx_inventory_ship_date ON inventory_items(earliest_ship_date);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory_items(status);
CREATE INDEX IF NOT EXISTS idx_inventory_expired ON inventory_items(is_expired);
CREATE INDEX IF NOT EXISTS idx_inventory_mpn ON inventory_items(mpn);
CREATE INDEX IF NOT EXISTS idx_inventory_confidence ON inventory_items(confidence_score);

-- ---------------------------------------------------------------
-- 10. Recommendations table
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recommendations (
    id SERIAL PRIMARY KEY,
    rfq_id INTEGER NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
    recommended_quotes JSONB NOT NULL,
    algorithm_version VARCHAR(50) DEFAULT 'rule_based_v1',
    buyer_notes TEXT,
    is_reviewed BOOLEAN DEFAULT FALSE,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recommendations_rfq ON recommendations(rfq_id);

-- ---------------------------------------------------------------
-- 11. Audit Log table
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    entity_type VARCHAR(100) NOT NULL,
    entity_id INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN ('create', 'update', 'delete', 'status_change')),
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);

-- ---------------------------------------------------------------
-- 12. Notifications table
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    rfq_id INTEGER,
    quote_id INTEGER,
    is_read BOOLEAN DEFAULT FALSE,
    is_sent_email BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- ---------------------------------------------------------------
-- Apply updated_at triggers (DROP first to allow re-run)
-- ---------------------------------------------------------------
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
DROP TRIGGER IF EXISTS update_rfqs_updated_at ON rfqs;
DROP TRIGGER IF EXISTS update_quotes_updated_at ON quotes;
DROP TRIGGER IF EXISTS update_vendors_updated_at ON vendors;
DROP TRIGGER IF EXISTS update_inventory_updated_at ON inventory_items;
DROP TRIGGER IF EXISTS update_recommendations_updated_at ON recommendations;

CREATE TRIGGER update_users_updated_at          BEFORE UPDATE ON users           FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at     BEFORE UPDATE ON categories      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at      BEFORE UPDATE ON suppliers       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rfqs_updated_at           BEFORE UPDATE ON rfqs            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at         BEFORE UPDATE ON quotes          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendors_updated_at        BEFORE UPDATE ON vendors         FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at      BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recommendations_updated_at BEFORE UPDATE ON recommendations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------
-- Done
-- ---------------------------------------------------------------
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully! 12 tables ready.';
END $$;
