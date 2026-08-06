-- Switchyard PostgreSQL Database Schema with Row-Level Security (RLS)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tenants
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL for admin
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'TENANT_MGR', 'DRIVER')),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Sites
CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    cap_kw NUMERIC(10, 2) NOT NULL,
    cap_phase_a NUMERIC(10, 2) NOT NULL,
    cap_phase_b NUMERIC(10, 2) NOT NULL,
    cap_phase_c NUMERIC(10, 2) NOT NULL,
    base_load_kw NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Circuits (Panel Hierarchy)
CREATE TABLE circuits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    cap_kw NUMERIC(10, 2) NOT NULL,
    parent_circuit_id UUID REFERENCES circuits(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tariffs (Time of Use & Carbon Intensity)
CREATE TABLE tariffs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    dow INT NOT NULL CHECK (dow BETWEEN 0 AND 6), -- 0=Sunday
    start_min INT NOT NULL CHECK (start_min BETWEEN 0 AND 1439),
    end_min INT NOT NULL CHECK (end_min BETWEEN 0 AND 1439),
    price_per_kwh NUMERIC(10, 4) NOT NULL,
    demand_charge_per_kw NUMERIC(10, 4) DEFAULT 0.00,
    carbon_gco2_per_kwh NUMERIC(10, 2) DEFAULT 250.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5b. Arrival Pattern Priors (Planner historical base load & plug-in prior)
CREATE TABLE arrival_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    dow INT NOT NULL CHECK (dow BETWEEN 0 AND 6),
    bucket INT NOT NULL CHECK (bucket BETWEEN 0 AND 95),
    avg_base_kw NUMERIC(10, 2) DEFAULT 0.00,
    avg_plugins INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5c. Charger Health & Fault Detection Logging
CREATE TABLE charger_health (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    charger_id UUID NOT NULL REFERENCES chargers(id) ON DELETE CASCADE,
    ts TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    event VARCHAR(50) NOT NULL, -- 'OFFLINE', 'FAILED_TX', 'METER_STALL'
    detail TEXT
);

-- 6. Entitlements (D1)
CREATE TABLE entitlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    floor_kw NUMERIC(10, 2) NOT NULL,
    tier_weight NUMERIC(5, 2) DEFAULT 1.00,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_to TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Chargers
CREATE TABLE chargers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    circuit_id UUID REFERENCES circuits(id) ON DELETE SET NULL,
    ocpp_id VARCHAR(100) UNIQUE NOT NULL,
    vendor VARCHAR(100) DEFAULT 'SwitchyardSim',
    model VARCHAR(100) DEFAULT 'SY-22KW',
    max_kw NUMERIC(10, 2) NOT NULL DEFAULT 22.00,
    status VARCHAR(50) DEFAULT 'Available',
    phase_assignment VARCHAR(10) DEFAULT 'L1,L2,L3', -- 'L1', 'L2', 'L3' or 'L1,L2,L3'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Connectors
CREATE TABLE connectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    charger_id UUID NOT NULL REFERENCES chargers(id) ON DELETE CASCADE,
    connector_index INT NOT NULL DEFAULT 1,
    status VARCHAR(50) DEFAULT 'Available',
    current_session_id UUID,
    CONSTRAINT uq_charger_connector UNIQUE(charger_id, connector_index)
);

-- 9. Vehicles
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    license_plate VARCHAR(50) UNIQUE NOT NULL,
    battery_capacity_kwh NUMERIC(10, 2) NOT NULL,
    max_charge_rate_kw NUMERIC(10, 2) NOT NULL DEFAULT 22.00,
    min_charge_rate_kw NUMERIC(10, 2) NOT NULL DEFAULT 4.14, -- 6A @ 230V 3-phase (~4.14kW) or 1-phase (1.38kW)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Sessions
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    charger_id UUID NOT NULL REFERENCES chargers(id) ON DELETE CASCADE,
    connector_index INT NOT NULL DEFAULT 1,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
    start_soc NUMERIC(5, 2) NOT NULL,
    current_soc NUMERIC(5, 2) NOT NULL,
    target_soc NUMERIC(5, 2) NOT NULL,
    allocated_kw NUMERIC(10, 2) DEFAULT 0.00,
    measured_kw NUMERIC(10, 2) DEFAULT 0.00,
    delivered_kwh NUMERIC(10, 2) DEFAULT 0.00,
    state VARCHAR(50) NOT NULL DEFAULT 'PluggedIn', -- PluggedIn, Charging, Throttled, Paused, Completed, Faulted
    phase_assignment VARCHAR(10) DEFAULT 'L1,L2,L3',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Allocations (Time Series - D2)
CREATE TABLE allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    ts TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    allocated_kw NUMERIC(10, 2) NOT NULL,
    tier INT NOT NULL CHECK (tier IN (0, 1, 2)),
    binding_constraint VARCHAR(255),
    shadow_price NUMERIC(10, 4) DEFAULT 0.00,
    reason_text TEXT
);

-- 12. Charge Promises (D3)
CREATE TABLE charge_promises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    promised_soc NUMERIC(5, 2) NOT NULL,
    promised_by TIMESTAMP WITH TIME ZONE NOT NULL,
    confidence VARCHAR(50) DEFAULT 'HIGH', -- HIGH, MEDIUM, LOW, INFEASIBLE
    state VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, FULFILLED, RENEGOTIATING, BREACHED
    renegotiated_from UUID REFERENCES charge_promises(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Fairness Ledger
CREATE TABLE fairness_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    debt_kwh NUMERIC(10, 4) DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Capacity Credits (D1 Billing)
CREATE TABLE capacity_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    period VARCHAR(50) NOT NULL, -- e.g. '2026-08'
    released_kwh NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    credit_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

--------------------------------------------------------------------------------
-- INDEXES (tenant_id leading where applicable per performance guidelines)
--------------------------------------------------------------------------------
CREATE INDEX idx_users_tenant ON users (tenant_id);
CREATE INDEX idx_entitlements_tenant_site ON entitlements (tenant_id, site_id);
CREATE INDEX idx_vehicles_tenant ON vehicles (tenant_id);
CREATE INDEX idx_sessions_tenant_state ON sessions (tenant_id, state);
CREATE INDEX idx_allocations_tenant_session ON allocations (tenant_id, session_id, ts DESC);
CREATE INDEX idx_promises_tenant_session ON charge_promises (tenant_id, session_id);
CREATE INDEX idx_fairness_tenant_session ON fairness_ledger (tenant_id, session_id);
CREATE INDEX idx_credits_tenant_site ON capacity_credits (tenant_id, site_id);

--------------------------------------------------------------------------------
-- ROLES & PERMISSIONS FOR RLS ENFORCEMENT
--------------------------------------------------------------------------------

-- Create app_user (non-owner application role)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user') THEN
        CREATE ROLE app_user WITH LOGIN PASSWORD 'app_user_secret';
    END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'optimizer_role') THEN
        CREATE ROLE optimizer_role WITH LOGIN PASSWORD 'optimizer_secret' BYPASSRLS;
    END IF;
END
$$;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO optimizer_role;

--------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES & FORCE ENFORCEMENT
--------------------------------------------------------------------------------

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;

ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlements FORCE ROW LEVEL SECURITY;

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles FORCE ROW LEVEL SECURITY;

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions FORCE ROW LEVEL SECURITY;

ALTER TABLE allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocations FORCE ROW LEVEL SECURITY;

ALTER TABLE charge_promises ENABLE ROW LEVEL SECURITY;
ALTER TABLE charge_promises FORCE ROW LEVEL SECURITY;

ALTER TABLE fairness_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE fairness_ledger FORCE ROW LEVEL SECURITY;

ALTER TABLE capacity_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE capacity_credits FORCE ROW LEVEL SECURITY;

-- Dynamic RLS policies relying on app.tenant_id setting.
-- If app.tenant_id is NULL or not set, no rows are returned unless bypass role is used.

CREATE POLICY tenant_isolation_users ON users
    USING (tenant_id IS NULL OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id IS NULL OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_entitlements ON entitlements
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_vehicles ON vehicles
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_sessions ON sessions
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_allocations ON allocations
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_charge_promises ON charge_promises
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_fairness_ledger ON fairness_ledger
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_capacity_credits ON capacity_credits
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
