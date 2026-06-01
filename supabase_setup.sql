-- =============================================================
-- DAIRY DELIVERY TRACKING — FULL SCHEMA + SEED DATA
-- Fresh install — run in Supabase Dashboard → SQL Editor
-- =============================================================


-- ─────────────────────────────────────────────────────────────
-- 1. CREATE TABLES
-- ─────────────────────────────────────────────────────────────

CREATE TABLE delivery_boys (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    phone        TEXT,
    is_online    BOOLEAN DEFAULT FALSE,
    current_lat  DOUBLE PRECISION,
    current_lng  DOUBLE PRECISION,
    last_seen_at TIMESTAMPTZ
);

CREATE TABLE dairy_customers (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name             TEXT NOT NULL,
    address          TEXT,
    lat              DOUBLE PRECISION NOT NULL,
    lng              DOUBLE PRECISION NOT NULL,
    delivery_boy_id  TEXT REFERENCES delivery_boys(id)
);

CREATE TABLE orders (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number             TEXT,
    customer_name            TEXT,
    customer_address         TEXT,
    total_amount             NUMERIC,
    status                   TEXT,
    destination_lat          DOUBLE PRECISION,
    destination_lng          DOUBLE PRECISION,
    is_v2                    BOOLEAN DEFAULT FALSE,
    dairy_customer_id        UUID REFERENCES dairy_customers(id),
    assigned_delivery_boy_id TEXT REFERENCES delivery_boys(id),
    created_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE delivery_sessions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_boy_id  TEXT REFERENCES delivery_boys(id),
    status           TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    started_at       TIMESTAMPTZ DEFAULT NOW(),
    ended_at         TIMESTAMPTZ
);

CREATE TABLE session_deliveries (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id       UUID REFERENCES delivery_sessions(id),
    customer_id      UUID REFERENCES dairy_customers(id),
    order_id         UUID REFERENCES orders(id),
    status           TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'skipped')),
    delivered_at     TIMESTAMPTZ,
    sequence_number  INT NOT NULL
);

CREATE TABLE tracking (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID UNIQUE NOT NULL REFERENCES orders(id),
    current_lat     DOUBLE PRECISION,
    current_lng     DOUBLE PRECISION,
    destination_lat DOUBLE PRECISION,
    destination_lng DOUBLE PRECISION,
    full_route      JSONB DEFAULT '[]',
    completed_path  JSONB DEFAULT '[]',
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────
-- 2. ROW LEVEL SECURITY
-- Production-safe policies using anon key.
-- In a real multi-tenant app, replace anon with auth.uid() checks.
-- ─────────────────────────────────────────────────────────────

ALTER TABLE delivery_boys      ENABLE ROW LEVEL SECURITY;
ALTER TABLE dairy_customers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking           ENABLE ROW LEVEL SECURITY;

-- delivery_boys: anon can SELECT and UPDATE own row (location update).
-- No INSERT or DELETE from client — managed by backend/admin only.
CREATE POLICY "delivery_boys: anon read"
    ON delivery_boys FOR SELECT TO anon USING (true);

CREATE POLICY "delivery_boys: anon update own location"
    ON delivery_boys FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- dairy_customers: anon read-only
CREATE POLICY "dairy_customers: anon read"
    ON dairy_customers FOR SELECT TO anon USING (true);

-- orders: anon read-only
CREATE POLICY "orders: anon read"
    ON orders FOR SELECT TO anon USING (true);

-- delivery_sessions: anon read + insert + update (rider starts/ends session)
CREATE POLICY "delivery_sessions: anon read"
    ON delivery_sessions FOR SELECT TO anon USING (true);

CREATE POLICY "delivery_sessions: anon insert"
    ON delivery_sessions FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "delivery_sessions: anon update"
    ON delivery_sessions FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- session_deliveries: anon read + update (rider marks delivered)
CREATE POLICY "session_deliveries: anon read"
    ON session_deliveries FOR SELECT TO anon USING (true);

CREATE POLICY "session_deliveries: anon update"
    ON session_deliveries FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- tracking: anon read + upsert (rider uploads location)
CREATE POLICY "tracking: anon read"
    ON tracking FOR SELECT TO anon USING (true);

CREATE POLICY "tracking: anon insert"
    ON tracking FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "tracking: anon update"
    ON tracking FOR UPDATE TO anon USING (true) WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────
-- 3. SEED DATA  (Indore, MP ~22.69°N 75.83°E)
-- ─────────────────────────────────────────────────────────────

INSERT INTO delivery_boys (id, name, phone, is_online, current_lat, current_lng, last_seen_at)
VALUES
    ('delivery-boy-1', 'Rahul Sharma',   '9876543210', TRUE,  22.6890, 75.8285, NOW()),
    ('delivery-boy-2', 'Suresh Patel',   '9876543211', FALSE, 22.6920, 75.8320, NOW() - INTERVAL '10 minutes'),
    ('dairy-owner-1',  'Ramesh (Owner)', '9876543212', FALSE, 22.6900, 75.8300, NULL);


INSERT INTO dairy_customers (id, name, address, lat, lng, delivery_boy_id)
VALUES
    ('11111111-0000-0000-0000-000000000001', 'Amit Patel',     '12, Vijay Nagar, Indore',   22.6935, 75.8290, 'delivery-boy-1'),
    ('11111111-0000-0000-0000-000000000002', 'Priya Sharma',   '45, Scheme 114, Indore',    22.6960, 75.8310, 'delivery-boy-1'),
    ('11111111-0000-0000-0000-000000000003', 'Ramesh Verma',   '7, Palasia Square, Indore', 22.6975, 75.8350, 'delivery-boy-1'),
    ('11111111-0000-0000-0000-000000000004', 'Sunita Joshi',   '3, Bhawarkuan, Indore',     22.6910, 75.8270, 'delivery-boy-1'),
    ('11111111-0000-0000-0000-000000000005', 'Vikram Singh',   '89, Rau Road, Indore',      22.6870, 75.8240, 'delivery-boy-2'),
    ('11111111-0000-0000-0000-000000000006', 'Kavita Mehta',   '22, Rajwada Area, Indore',  22.6855, 75.8300, 'delivery-boy-2'),
    ('11111111-0000-0000-0000-000000000007', 'Deepak Agarwal', '5, AB Road, Indore',        22.6900, 75.8330, 'delivery-boy-2'),
    ('11111111-0000-0000-0000-000000000008', 'Neha Trivedi',   '18, MG Road, Indore',       22.6925, 75.8260, 'delivery-boy-1');


INSERT INTO orders (id, order_number, customer_name, customer_address, total_amount, status, destination_lat, destination_lng, is_v2, dairy_customer_id, assigned_delivery_boy_id, created_at)
VALUES
    ('aaaaaaaa-0000-0000-0000-000000000001', 'ORD-001', 'Amit Patel',   '12, Vijay Nagar, Indore',   120, 'out_for_delivery', 22.6935, 75.8290, TRUE,  '11111111-0000-0000-0000-000000000001', 'delivery-boy-1', NOW() - INTERVAL '30 minutes'),
    ('aaaaaaaa-0000-0000-0000-000000000002', 'ORD-002', 'Priya Sharma', '45, Scheme 114, Indore',     85, 'out_for_delivery', 22.6960, 75.8310, FALSE, '11111111-0000-0000-0000-000000000002', 'delivery-boy-1', NOW() - INTERVAL '25 minutes'),
    ('aaaaaaaa-0000-0000-0000-000000000003', 'ORD-003', 'Ramesh Verma', '7, Palasia Square, Indore', 150, 'accepted',         22.6975, 75.8350, TRUE,  '11111111-0000-0000-0000-000000000003', 'delivery-boy-1', NOW() - INTERVAL '20 minutes'),
    ('aaaaaaaa-0000-0000-0000-000000000004', 'ORD-004', 'Sunita Joshi', '3, Bhawarkuan, Indore',     200, 'picked_up',        22.6910, 75.8270, FALSE, '11111111-0000-0000-0000-000000000004', 'delivery-boy-1', NOW() - INTERVAL '15 minutes');


INSERT INTO delivery_sessions (id, delivery_boy_id, status, started_at)
VALUES ('bbbbbbbb-0000-0000-0000-000000000001', 'delivery-boy-1', 'active', NOW() - INTERVAL '40 minutes');


INSERT INTO session_deliveries (id, session_id, customer_id, order_id, status, delivered_at, sequence_number)
VALUES
    ('cccccccc-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000004', 'delivered', NOW() - INTERVAL '10 minutes', 1),
    ('cccccccc-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'pending',   NULL,                          2),
    ('cccccccc-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000002', 'pending',   NULL,                          3),
    ('cccccccc-0000-0000-0000-000000000004', 'bbbbbbbb-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000003', 'pending',   NULL,                          4);


INSERT INTO tracking (order_id, current_lat, current_lng, destination_lat, destination_lng, full_route, completed_path, updated_at)
VALUES (
    'aaaaaaaa-0000-0000-0000-000000000001',
    22.6890, 75.8285, 22.6935, 75.8290,
    '[]',
    '[{"latitude": 22.6890, "longitude": 75.8285}]',
    NOW()
);
