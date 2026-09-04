-- ============================================================================
-- ENTERPRISE MULTI-TENANT HOSPITALITY & BOOKING SAAS DATABASE SCHEMA
-- PostgreSQL 14+ / Supabase Production Schema
-- ============================================================================

-- Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- DOMAIN 1: IDENTITY, TENANCY & RBAC
-- ============================================================================

CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(64) UNIQUE NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    legal_entity_name VARCHAR(255),
    business_category VARCHAR(64) NOT NULL, -- 'THEATER_GAMING', 'ESCAPE_ROOM', 'EVENT_SPACE', 'SALON'
    contact_phone VARCHAR(32) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR' NOT NULL,
    timezone VARCHAR(64) DEFAULT 'Asia/Kolkata' NOT NULL,
    branding JSONB DEFAULT '{"primaryColor": "#ff0055", "accentColor": "#00f0ff"}'::jsonb NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_tenant_id_composite UNIQUE (id)
);

CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL, -- e.g. "BeeVibe Bangalore Main"
    slug VARCHAR(64) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(20) NOT NULL,
    contact_phone VARCHAR(32),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_location_composite UNIQUE (tenant_id, id),
    CONSTRAINT uq_location_tenant_slug UNIQUE (tenant_id, slug)
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(32) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    is_platform_superadmin BOOLEAN DEFAULT FALSE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL for system-wide platform roles
    name VARCHAR(64) NOT NULL, -- 'TENANT_OWNER', 'MANAGER', 'RECEPTIONIST', 'ACCOUNTANT'
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_role_tenant_name UNIQUE (tenant_id, name)
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(64) UNIQUE NOT NULL, -- e.g. 'booking.view', 'payment.verify', 'settings.payment.modify'
    module VARCHAR(64) NOT NULL,
    description TEXT NOT NULL
);

CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE tenant_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_membership_tenant_user UNIQUE (tenant_id, user_id),
    CONSTRAINT uq_membership_composite UNIQUE (tenant_id, id)
);

-- ============================================================================
-- DOMAIN 2: RESOURCES, SERVICES & BOOKING ENGINE
-- ============================================================================

CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    location_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL, -- e.g. "Red Velvet Romance Room", "PS5 Gaming Lounge"
    resource_type VARCHAR(64) NOT NULL, -- 'THEATER_ROOM', 'GAMING_STATION', 'COURT', 'TABLE'
    capacity INT DEFAULT 2 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_resource_location FOREIGN KEY (tenant_id, location_id) REFERENCES locations(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT uq_resource_composite UNIQUE (tenant_id, id),
    CONSTRAINT uq_resource_tenant_name UNIQUE (tenant_id, location_id, name)
);

CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL, -- e.g. "Red Theme Private Theater Celebration"
    slug VARCHAR(64) NOT NULL,
    description TEXT,
    base_price NUMERIC(12, 2) NOT NULL,
    duration_minutes INT NOT NULL, -- e.g. 120
    advance_amount NUMERIC(12, 2) DEFAULT 500.00 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_service_composite UNIQUE (tenant_id, id),
    CONSTRAINT uq_service_tenant_slug UNIQUE (tenant_id, slug)
);

CREATE TABLE availability_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    resource_id UUID NOT NULL,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    slot_duration_minutes INT NOT NULL,
    buffer_minutes INT DEFAULT 15 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    CONSTRAINT fk_availability_resource FOREIGN KEY (tenant_id, resource_id) REFERENCES resources(tenant_id, id) ON DELETE CASCADE,
    CONSTRAINT uq_availability_rule UNIQUE (tenant_id, resource_id, day_of_week, open_time)
);

-- Concurrency Hold Engine (10-minute hold TTL with temporal overlap exclusion)
CREATE TABLE booking_holds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    resource_id UUID NOT NULL,
    hold_range TSTZRANGE NOT NULL,
    session_id VARCHAR(128) NOT NULL,
    customer_phone VARCHAR(32) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(32) DEFAULT 'HELD' NOT NULL CHECK (status IN ('HELD', 'CONVERTED', 'EXPIRED', 'RELEASED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_hold_resource FOREIGN KEY (tenant_id, resource_id) REFERENCES resources(tenant_id, id) ON DELETE CASCADE,
    CONSTRAINT uq_hold_composite UNIQUE (tenant_id, id),
    -- GiST Exclusion constraint: Prevents any overlapping active holds
    CONSTRAINT exclude_overlapping_holds EXCLUDE USING gist (
        resource_id WITH =,
        hold_range WITH &&
    ) WHERE (status = 'HELD')
);

-- ============================================================================
-- DOMAIN 4: CUSTOMERS
-- ============================================================================

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    phone VARCHAR(32) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    date_of_birth DATE,
    anniversary_date DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_customer_composite UNIQUE (tenant_id, id),
    CONSTRAINT uq_customer_tenant_phone UNIQUE (tenant_id, phone)
);

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    location_id UUID NOT NULL,
    resource_id UUID NOT NULL,
    service_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    reference_code VARCHAR(32) NOT NULL, -- e.g. "BV-2026-X9Y2"
    booking_range TSTZRANGE NOT NULL,
    guest_count INT DEFAULT 2 NOT NULL,
    base_price NUMERIC(12, 2) NOT NULL,
    addons_total NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    advance_amount NUMERIC(12, 2) NOT NULL,
    balance_amount NUMERIC(12, 2) NOT NULL,
    booking_status VARCHAR(32) DEFAULT 'PAYMENT_PENDING' NOT NULL 
        CHECK (booking_status IN ('DRAFT', 'HELD', 'PAYMENT_PENDING', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'EXPIRED')),
    payment_status VARCHAR(32) DEFAULT 'UNPAID' NOT NULL 
        CHECK (payment_status IN ('UNPAID', 'PARTIALLY_PAID', 'ADVANCE_PAID', 'FULLY_PAID', 'PARTIALLY_REFUNDED', 'REFUNDED')),
    special_requests TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    -- Composite FK enforcement ensuring strict cross-tenant integrity
    CONSTRAINT fk_booking_location FOREIGN KEY (tenant_id, location_id) REFERENCES locations(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_booking_resource FOREIGN KEY (tenant_id, resource_id) REFERENCES resources(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_booking_service FOREIGN KEY (tenant_id, service_id) REFERENCES services(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_booking_customer FOREIGN KEY (tenant_id, customer_id) REFERENCES customers(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT uq_booking_composite UNIQUE (tenant_id, id),
    CONSTRAINT uq_booking_tenant_ref UNIQUE (tenant_id, reference_code),
    -- Exclusion constraint to guarantee zero double bookings
    CONSTRAINT exclude_overlapping_confirmed_bookings EXCLUDE USING gist (
        resource_id WITH =,
        booking_range WITH &&
    ) WHERE (booking_status IN ('CONFIRMED', 'CHECKED_IN'))
);

CREATE TABLE booking_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    booking_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    quantity INT DEFAULT 1 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_addon_booking FOREIGN KEY (tenant_id, booking_id) REFERENCES bookings(tenant_id, id) ON DELETE CASCADE
);

-- ============================================================================
-- DOMAIN 3: PAYMENTS, ROUTING & RECONCILIATION
-- ============================================================================

CREATE TABLE tenant_payment_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    provider VARCHAR(64) NOT NULL, -- 'MANUAL_UPI', 'RAZORPAY', 'CASHFREE', 'DECENTRO', 'DIRECT_BANK'
    provider_account_id VARCHAR(128),
    capabilities JSONB DEFAULT '["UPI"]'::jsonb NOT NULL,
    credential_reference VARCHAR(255), -- KMS/Vault reference: "secret://tenants/123/razorpay"
    configuration JSONB DEFAULT '{}'::jsonb NOT NULL, -- Payee Name, UPI ID, Bank Name, QR image
    confirmation_policy VARCHAR(64) DEFAULT 'BANK_RECONCILIATION' NOT NULL 
        CHECK (confirmation_policy IN ('AUTHORITATIVE_WEBHOOK', 'BANK_RECONCILIATION', 'ADMIN_VERIFICATION', 'MANUAL_OVERRIDE')),
    priority INT DEFAULT 1 NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_tenant_payment_account UNIQUE (tenant_id, provider, provider_account_id),
    CONSTRAINT uq_payment_account_composite UNIQUE (tenant_id, id)
);

CREATE TABLE payment_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    booking_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR' NOT NULL,
    purpose VARCHAR(64) NOT NULL CHECK (purpose IN ('BOOKING_ADVANCE', 'VENUE_BALANCE', 'FOOD_ORDER', 'CANCELLATION_FEE')),
    status VARCHAR(32) DEFAULT 'CREATED' NOT NULL 
        CHECK (status IN ('CREATED', 'INITIATED', 'PENDING', 'VERIFYING', 'SUCCESS', 'FAILED', 'EXPIRED', 'REFUNDED', 'DISPUTED')),
    merchant_reference VARCHAR(64) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_payment_order_booking FOREIGN KEY (tenant_id, booking_id) REFERENCES bookings(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_payment_order_customer FOREIGN KEY (tenant_id, customer_id) REFERENCES customers(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT uq_payment_order_composite UNIQUE (tenant_id, id),
    CONSTRAINT uq_payment_order_merchant_ref UNIQUE (tenant_id, merchant_reference)
);

CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    payment_order_id UUID NOT NULL,
    tenant_payment_account_id UUID NOT NULL,
    provider VARCHAR(64) NOT NULL,
    provider_transaction_id VARCHAR(255),
    bank_reference VARCHAR(255), -- UTR or Bank Transaction Reference
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR' NOT NULL,
    status VARCHAR(32) DEFAULT 'INITIATED' NOT NULL 
        CHECK (status IN ('INITIATED', 'PENDING_VERIFICATION', 'SUCCESS', 'FAILED', 'EXPIRED', 'DISPUTED')),
    raw_provider_data JSONB DEFAULT '{}'::jsonb NOT NULL,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_transaction_order FOREIGN KEY (tenant_id, payment_order_id) REFERENCES payment_orders(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_transaction_account FOREIGN KEY (tenant_id, tenant_payment_account_id) REFERENCES tenant_payment_accounts(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT uq_transaction_composite UNIQUE (tenant_id, id)
);

CREATE TABLE reconciliation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    payment_transaction_id UUID NOT NULL,
    verified_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    verification_method VARCHAR(64) NOT NULL CHECK (verification_method IN ('WEBHOOK', 'ADMIN_MANUAL', 'BANK_FEED_MATCH', 'MANUAL_OVERRIDE')),
    status VARCHAR(32) NOT NULL CHECK (status IN ('MATCHED', 'MISMATCH_FLAGGED', 'RECONCILED')),
    bank_statement_line_id VARCHAR(255),
    notes TEXT,
    reconciled_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_recon_transaction FOREIGN KEY (tenant_id, payment_transaction_id) REFERENCES payment_transactions(tenant_id, id) ON DELETE CASCADE,
    CONSTRAINT uq_recon_composite UNIQUE (tenant_id, id)
);

CREATE TABLE venue_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    booking_id UUID NOT NULL,
    collected_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    amount_collected NUMERIC(12, 2) NOT NULL,
    payment_mode VARCHAR(32) NOT NULL CHECK (payment_mode IN ('CASH', 'UPI_DESK', 'CARD_POS')),
    settlement_notes TEXT,
    settled_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_settlement_booking FOREIGN KEY (tenant_id, booking_id) REFERENCES bookings(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT uq_venue_settlement_composite UNIQUE (tenant_id, id)
);

CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    provider VARCHAR(64) NOT NULL,
    event_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(128) NOT NULL,
    signature_valid BOOLEAN DEFAULT FALSE NOT NULL,
    payload JSONB NOT NULL,
    processing_status VARCHAR(32) DEFAULT 'PENDING' NOT NULL CHECK (processing_status IN ('PENDING', 'PROCESSED', 'FAILED', 'IGNORED')),
    error_log TEXT,
    received_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    processed_at TIMESTAMPTZ,
    CONSTRAINT uq_webhook_provider_event UNIQUE (provider, event_id)
);

CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    payment_transaction_id UUID NOT NULL,
    payment_order_id UUID NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    reason TEXT NOT NULL,
    provider_refund_id VARCHAR(255),
    status VARCHAR(32) DEFAULT 'PENDING' NOT NULL CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
    initiated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_refund_transaction FOREIGN KEY (tenant_id, payment_transaction_id) REFERENCES payment_transactions(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_refund_order FOREIGN KEY (tenant_id, payment_order_id) REFERENCES payment_orders(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT uq_refund_composite UNIQUE (tenant_id, id)
);

-- ============================================================================
-- DOMAIN 4: CRM, GUEST INTELLIGENCE & AUTOMATIONS
-- ============================================================================

CREATE TABLE customer_metrics (
    customer_id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    total_bookings INT DEFAULT 0 NOT NULL,
    completed_bookings INT DEFAULT 0 NOT NULL,
    lifetime_spend NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    first_visit_at TIMESTAMPTZ,
    last_visit_at TIMESTAMPTZ,
    favorite_resource_id UUID,
    rfm_score INT DEFAULT 0 NOT NULL,
    calculated_segment VARCHAR(64) DEFAULT 'NEW' NOT NULL,
    calculated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_metric_customer FOREIGN KEY (tenant_id, customer_id) REFERENCES customers(tenant_id, id) ON DELETE CASCADE,
    CONSTRAINT fk_metric_resource FOREIGN KEY (tenant_id, favorite_resource_id) REFERENCES resources(tenant_id, id) ON DELETE SET NULL
);

CREATE TABLE customer_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    author_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_note_customer FOREIGN KEY (tenant_id, customer_id) REFERENCES customers(tenant_id, id) ON DELETE CASCADE,
    CONSTRAINT uq_customer_note_composite UNIQUE (tenant_id, id)
);

CREATE TABLE crm_segment_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    segment_name VARCHAR(64) NOT NULL,
    conditions JSONB NOT NULL,
    priority INT DEFAULT 1 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_segment_tenant_name UNIQUE (tenant_id, segment_name),
    CONSTRAINT uq_segment_composite UNIQUE (tenant_id, id)
);

CREATE TABLE automations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    trigger_event VARCHAR(64) NOT NULL,
    conditions JSONB DEFAULT '{}'::jsonb NOT NULL,
    delay_minutes INT DEFAULT 0 NOT NULL,
    action_type VARCHAR(64) NOT NULL CHECK (action_type IN ('SEND_WHATSAPP', 'SEND_SMS', 'SEND_EMAIL')),
    template_body TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_automation_composite UNIQUE (tenant_id, id)
);

CREATE TABLE marketing_outreach_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    automation_id UUID REFERENCES automations(id) ON DELETE SET NULL,
    channel VARCHAR(32) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    message_body TEXT NOT NULL,
    status VARCHAR(32) DEFAULT 'SENT' NOT NULL CHECK (status IN ('QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'CLICKED')),
    sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_outreach_customer FOREIGN KEY (tenant_id, customer_id) REFERENCES customers(tenant_id, id) ON DELETE CASCADE,
    CONSTRAINT uq_outreach_composite UNIQUE (tenant_id, id)
);

-- ============================================================================
-- DOMAIN 5: PLATFORM SAAS BILLING, AUDIT & OUTBOX
-- ============================================================================

CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(64) UNIQUE NOT NULL, -- 'STARTER', 'PRO', 'ENTERPRISE'
    name VARCHAR(255) NOT NULL,
    price_monthly NUMERIC(12, 2) NOT NULL,
    features JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID UNIQUE NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
    status VARCHAR(32) DEFAULT 'ACTIVE' NOT NULL CHECK (status IN ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED')),
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE subscription_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR' NOT NULL,
    status VARCHAR(32) DEFAULT 'PAID' NOT NULL CHECK (status IN ('DRAFT', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE')),
    invoice_pdf_url TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Transactional Outbox Pattern for Async Events
CREATE TABLE outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    aggregate_type VARCHAR(64) NOT NULL,
    aggregate_id UUID NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(32) DEFAULT 'PENDING' NOT NULL CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    retry_count INT DEFAULT 0 NOT NULL,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    processed_at TIMESTAMPTZ
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(128) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================================================
-- DOMAIN 6: COMPREHENSIVE ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_payment_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_segment_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_outreach_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION current_app_tenant_id() RETURNS UUID AS $$
    SELECT NULLIF(current_setting('app.current_tenant_id', true), '')::uuid;
$$ LANGUAGE sql STABLE;

CREATE POLICY rls_locations ON locations FOR ALL USING (tenant_id = current_app_tenant_id());
CREATE POLICY rls_resources ON resources FOR ALL USING (tenant_id = current_app_tenant_id());
CREATE POLICY rls_services ON services FOR ALL USING (tenant_id = current_app_tenant_id());
CREATE POLICY rls_availability ON availability_rules FOR ALL USING (tenant_id = current_app_tenant_id());
CREATE POLICY rls_booking_holds ON booking_holds FOR ALL USING (tenant_id = current_app_tenant_id());
CREATE POLICY rls_bookings ON bookings FOR ALL USING (tenant_id = current_app_tenant_id());
CREATE POLICY rls_booking_addons ON booking_addons FOR ALL USING (tenant_id = current_app_tenant_id());
CREATE POLICY rls_payment_accounts ON tenant_payment_accounts FOR ALL USING (tenant_id = current_app_tenant_id());
CREATE POLICY rls_payment_orders ON payment_orders FOR ALL USING (tenant_id = current_app_tenant_id());
CREATE POLICY rls_payment_transactions ON payment_transactions FOR ALL USING (tenant_id = current_app_tenant_id());
CREATE POLICY rls_reconciliation_logs ON reconciliation_logs FOR ALL USING (tenant_id = current_app_tenant_id());
CREATE POLICY rls_venue_settlements ON venue_settlements FOR ALL USING (tenant_id = current_app_tenant_id());
CREATE POLICY rls_refunds ON refunds FOR ALL USING (tenant_id = current_app_tenant_id());
CREATE POLICY rls_customers ON customers FOR ALL USING (tenant_id = current_app_tenant_id());
CREATE POLICY rls_customer_metrics ON customer_metrics FOR ALL USING (tenant_id = current_app_tenant_id());
CREATE POLICY rls_customer_notes ON customer_notes FOR ALL USING (tenant_id = current_app_tenant_id());
CREATE POLICY rls_crm_segment_rules ON crm_segment_rules FOR ALL USING (tenant_id = current_app_tenant_id());
CREATE POLICY rls_automations ON automations FOR ALL USING (tenant_id = current_app_tenant_id());
CREATE POLICY rls_marketing_outreach_logs ON marketing_outreach_logs FOR ALL USING (tenant_id = current_app_tenant_id());
CREATE POLICY rls_outbox_events ON outbox_events FOR ALL USING (tenant_id = current_app_tenant_id());
CREATE POLICY rls_audit_logs ON audit_logs FOR ALL USING (tenant_id = current_app_tenant_id());
CREATE POLICY rls_subscriptions ON subscriptions FOR ALL USING (tenant_id = current_app_tenant_id());
CREATE POLICY rls_subscription_invoices ON subscription_invoices FOR ALL USING (tenant_id = current_app_tenant_id());

-- ============================================================================
-- DOMAIN 7: PERFORMANCE & LOOKUP INDEXES
-- ============================================================================

CREATE INDEX idx_bookings_tenant_range ON bookings (tenant_id, booking_range);
CREATE INDEX idx_bookings_tenant_status ON bookings (tenant_id, booking_status);
CREATE INDEX idx_booking_holds_active ON booking_holds (resource_id, expires_at) WHERE (status = 'HELD');
CREATE INDEX idx_payment_orders_tenant ON payment_orders (tenant_id, status);
CREATE INDEX idx_payment_transactions_tenant ON payment_transactions (tenant_id, status);
CREATE INDEX idx_payment_transactions_bank_ref ON payment_transactions (tenant_id, bank_reference);
CREATE INDEX idx_customers_tenant_phone ON customers (tenant_id, phone);
CREATE INDEX idx_customer_metrics_rfm ON customer_metrics (tenant_id, lifetime_spend DESC, total_bookings DESC);
CREATE INDEX idx_outbox_pending ON outbox_events (status, created_at) WHERE (status = 'PENDING');
CREATE INDEX idx_webhook_pending ON webhook_events (processing_status, received_at) WHERE (processing_status = 'PENDING');
