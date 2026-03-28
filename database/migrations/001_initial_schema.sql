-- ═══════════════════════════════════════════════════════════════════════════
-- LocalFashion Platform — Initial Database Schema
-- PostgreSQL 15+ | PostGIS | pgcrypto | pg_trgm
-- ═══════════════════════════════════════════════════════════════════════════

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─────────────────────────────────────────────────────────────────────────────
-- CITIES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE cities (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                VARCHAR(100) NOT NULL UNIQUE,
  lat                 NUMERIC(10,7) NOT NULL,
  lng                 NUMERIC(10,7) NOT NULL,
  delivery_radius_km  NUMERIC(5,2) DEFAULT 15,
  platform_fee_pct    NUMERIC(4,2) DEFAULT 15.00,
  sla_accept_mins     INTEGER DEFAULT 15,
  sla_ready_mins      INTEGER DEFAULT 30,
  is_active           BOOLEAN DEFAULT false,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- USERS (all roles)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       VARCHAR(15) NOT NULL UNIQUE,
  name        VARCHAR(150),
  email       VARCHAR(200),
  city_id     UUID REFERENCES cities(id),
  role        VARCHAR(20) NOT NULL CHECK (role IN ('buyer','seller','delivery','agent','admin')),
  gender      VARCHAR(10) CHECK (gender IN ('male','female','other')),
  size_pref   VARCHAR(10),
  fcm_token   TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX users_city_role_idx ON users(city_id, role);
CREATE INDEX users_phone_idx ON users(phone);

-- ─────────────────────────────────────────────────────────────────────────────
-- OTP STORE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE otp_records (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       VARCHAR(15) NOT NULL,
  otp         CHAR(6) NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  attempts    INTEGER DEFAULT 0,
  is_used     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX otp_phone_idx ON otp_records(phone, is_used);

-- ─────────────────────────────────────────────────────────────────────────────
-- CATEGORIES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(100) NOT NULL UNIQUE,
  icon_url    TEXT,
  parent_id   UUID REFERENCES categories(id),
  sort_order  INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- STORES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE stores (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id       UUID NOT NULL REFERENCES users(id),
  city_id             UUID NOT NULL REFERENCES cities(id),
  name                VARCHAR(200) NOT NULL,
  description         TEXT,
  address             TEXT NOT NULL,
  lat                 NUMERIC(10,7),
  lng                 NUMERIC(10,7),
  location            GEOGRAPHY(POINT, 4326),
  category_id         UUID REFERENCES categories(id),
  logo_url            TEXT,
  banner_url          TEXT,
  return_policy_days  INTEGER DEFAULT 7,
  prep_time_mins      INTEGER DEFAULT 20,
  platform_fee_pct    NUMERIC(4,2),
  gst_number          VARCHAR(20),
  bank_account        VARCHAR(30),
  bank_ifsc           VARCHAR(15),
  id_proof_url        TEXT,
  status              VARCHAR(20) DEFAULT 'pending'
                        CHECK (status IN ('pending','active','suspended','closed')),
  rejection_reason    TEXT,
  onboarded_by_agent  UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX stores_city_idx ON stores(city_id);
CREATE INDEX stores_owner_idx ON stores(owner_user_id);
CREATE INDEX stores_location_idx ON stores USING GIST(location);
CREATE INDEX stores_city_status_idx ON stores(city_id, status);

-- ─────────────────────────────────────────────────────────────────────────────
-- PRODUCTS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE products (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id       UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  city_id        UUID NOT NULL REFERENCES cities(id),
  name           VARCHAR(300) NOT NULL,
  description    TEXT,
  price          NUMERIC(10,2) NOT NULL CHECK (price > 0),
  mrp            NUMERIC(10,2) CHECK (mrp IS NULL OR mrp >= price),
  category_id    UUID REFERENCES categories(id),
  brand          VARCHAR(100),
  tags           TEXT[],
  sold_count     INTEGER DEFAULT 0,
  is_active      BOOLEAN DEFAULT true,
  search_vector  TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english',
      COALESCE(name,'') || ' ' ||
      COALESCE(description,'') || ' ' ||
      COALESCE(brand,'') || ' ' ||
      COALESCE(array_to_string(tags,' '),'')
    )
  ) STORED,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX products_city_active_idx ON products(city_id, is_active);
CREATE INDEX products_search_idx ON products USING GIN(search_vector);
CREATE INDEX products_store_idx ON products(store_id);
CREATE INDEX products_sold_idx ON products(city_id, sold_count DESC);
CREATE INDEX products_category_idx ON products(city_id, category_id);
CREATE INDEX products_price_idx ON products(city_id, price);
CREATE INDEX products_created_idx ON products(city_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- PRODUCT IMAGES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE product_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  is_primary  BOOLEAN DEFAULT false,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX product_images_product_idx ON product_images(product_id, sort_order);

-- ─────────────────────────────────────────────────────────────────────────────
-- VARIANTS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE variants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size            VARCHAR(20),
  color           VARCHAR(50),
  color_hex       CHAR(6),
  stock_quantity  INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  sku             VARCHAR(100),
  price_override  NUMERIC(10,2),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, size, color)
);
CREATE INDEX variants_product_idx ON variants(product_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- ADDRESSES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE addresses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label        VARCHAR(50) DEFAULT 'Home',
  full_address TEXT NOT NULL,
  area         VARCHAR(100),
  city         VARCHAR(100),
  pincode      VARCHAR(10),
  lat          NUMERIC(10,7),
  lng          NUMERIC(10,7),
  is_default   BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX addresses_user_idx ON addresses(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- CART ITEMS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE cart_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  variant_id  UUID NOT NULL REFERENCES variants(id),
  quantity    INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, variant_id)
);
CREATE INDEX cart_items_user_idx ON cart_items(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- CART LOCKS (soft + hard inventory holds)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE cart_locks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id  UUID NOT NULL REFERENCES variants(id),
  user_id     UUID NOT NULL REFERENCES users(id),
  quantity    INTEGER NOT NULL DEFAULT 1,
  lock_type   VARCHAR(10) DEFAULT 'soft' CHECK (lock_type IN ('soft','hard')),
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX cart_locks_variant_idx ON cart_locks(variant_id, expires_at);
CREATE INDEX cart_locks_user_idx ON cart_locks(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- ORDERS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id              UUID NOT NULL REFERENCES users(id),
  store_id              UUID NOT NULL REFERENCES stores(id),
  city_id               UUID NOT NULL REFERENCES cities(id),
  status                VARCHAR(30) NOT NULL DEFAULT 'pending_payment'
                          CHECK (status IN (
                            'pending_payment','confirmed','accepted',
                            'preparing','ready_for_pickup','assigned',
                            'picked_up','out_for_delivery','delivered',
                            'cancelled','return_requested','refunded'
                          )),
  subtotal              NUMERIC(10,2) NOT NULL,
  delivery_fee          NUMERIC(10,2) DEFAULT 0,
  platform_fee          NUMERIC(10,2) DEFAULT 0,
  total_amount          NUMERIC(10,2) NOT NULL,
  address_snapshot      JSONB NOT NULL,
  otp                   CHAR(6),
  otp_attempts          INTEGER DEFAULT 0,
  otp_expires_at        TIMESTAMPTZ,
  razorpay_order_id     VARCHAR(100),
  razorpay_payment_id   VARCHAR(100),
  cancellation_reason   TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  accepted_at           TIMESTAMPTZ,
  ready_at              TIMESTAMPTZ,
  picked_up_at          TIMESTAMPTZ,
  delivered_at          TIMESTAMPTZ,
  cancelled_at          TIMESTAMPTZ
);
CREATE INDEX orders_buyer_idx ON orders(buyer_id);
CREATE INDEX orders_store_idx ON orders(store_id);
CREATE INDEX orders_city_status_idx ON orders(city_id, status);
CREATE INDEX orders_created_idx ON orders(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- ORDER ITEMS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE order_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id        UUID NOT NULL REFERENCES variants(id),
  product_id        UUID NOT NULL REFERENCES products(id),
  quantity          INTEGER NOT NULL CHECK (quantity > 0),
  price_at_purchase NUMERIC(10,2) NOT NULL,
  product_snapshot  JSONB
);
CREATE INDEX order_items_order_idx ON order_items(order_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- DELIVERY PARTNERS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE delivery_partners (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id),
  city_id             UUID NOT NULL REFERENCES cities(id),
  vehicle_type        VARCHAR(20) CHECK (vehicle_type IN ('bicycle','motorcycle','auto')),
  status              VARCHAR(20) DEFAULT 'offline'
                        CHECK (status IN ('offline','online','on_delivery')),
  current_lat         NUMERIC(10,7),
  current_lng         NUMERIC(10,7),
  current_location    GEOGRAPHY(POINT, 4326),
  current_order_id    UUID REFERENCES orders(id),
  total_deliveries    INTEGER DEFAULT 0,
  avg_rating          NUMERIC(3,2) DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX dp_city_status_idx ON delivery_partners(city_id, status);
CREATE INDEX dp_location_idx ON delivery_partners USING GIST(current_location);

-- ─────────────────────────────────────────────────────────────────────────────
-- DELIVERY ASSIGNMENTS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE delivery_assignments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES orders(id),
  partner_id  UUID NOT NULL REFERENCES delivery_partners(id),
  status      VARCHAR(20) DEFAULT 'pending'
                CHECK (status IN ('pending','accepted','rejected','expired')),
  notified_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ NOT NULL,
  earnings    NUMERIC(10,2)
);
CREATE INDEX da_order_idx ON delivery_assignments(order_id);
CREATE INDEX da_partner_idx ON delivery_assignments(partner_id, status);

-- ─────────────────────────────────────────────────────────────────────────────
-- DELIVERY LOCATIONS (GPS log)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE delivery_locations (
  id          BIGSERIAL PRIMARY KEY,
  partner_id  UUID NOT NULL REFERENCES delivery_partners(id),
  order_id    UUID REFERENCES orders(id),
  lat         NUMERIC(10,7) NOT NULL,
  lng         NUMERIC(10,7) NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX dl_order_time_idx ON delivery_locations(order_id, recorded_at DESC);
CREATE INDEX dl_partner_idx ON delivery_locations(partner_id, recorded_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- RATINGS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE ratings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         UUID NOT NULL REFERENCES orders(id) UNIQUE,
  buyer_id         UUID NOT NULL REFERENCES users(id),
  product_id       UUID REFERENCES products(id),
  delivery_id      UUID REFERENCES delivery_partners(id),
  product_rating   SMALLINT CHECK (product_rating BETWEEN 1 AND 5),
  delivery_rating  SMALLINT CHECK (delivery_rating BETWEEN 1 AND 5),
  review_text      TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ratings_product_idx ON ratings(product_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- WISHLISTS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE wishlists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);
CREATE INDEX wishlists_user_idx ON wishlists(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- STORE FOLLOWS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE store_follows (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_id    UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, store_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- BANNERS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE banners (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id     UUID REFERENCES cities(id),
  title       VARCHAR(200),
  image_url   TEXT NOT NULL,
  link_url    TEXT,
  sort_order  INTEGER DEFAULT 0,
  starts_at   TIMESTAMPTZ,
  ends_at     TIMESTAMPTZ,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX banners_city_active_idx ON banners(city_id, is_active);

-- ─────────────────────────────────────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE notifications (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type      VARCHAR(50) NOT NULL,
  title     VARCHAR(200),
  body      TEXT,
  data      JSONB,
  is_read   BOOLEAN DEFAULT false,
  sent_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX notif_user_read_idx ON notifications(user_id, is_read, sent_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- SEARCH LOGS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE search_logs (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES users(id),
  city_id     UUID NOT NULL REFERENCES cities(id),
  query       VARCHAR(200) NOT NULL,
  results_count INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX search_logs_city_query_idx ON search_logs(city_id, query);

-- ─────────────────────────────────────────────────────────────────────────────
-- RETURN REQUESTS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE return_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders(id),
  buyer_id        UUID NOT NULL REFERENCES users(id),
  reason          VARCHAR(50) CHECK (reason IN (
                    'wrong_size','damaged','not_as_described','changed_mind','other'
                  )),
  description     TEXT,
  photo_urls      TEXT[],
  status          VARCHAR(20) DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','rejected','picked_up','refunded')),
  admin_note      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ
);
CREATE INDEX returns_order_idx ON return_requests(order_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- SLA VIOLATIONS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE sla_violations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    UUID NOT NULL REFERENCES stores(id),
  order_id    UUID NOT NULL REFERENCES orders(id),
  type        VARCHAR(30) CHECK (type IN ('accept_timeout','ready_timeout')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX sla_store_idx ON sla_violations(store_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- PAYOUTS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE payouts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id            UUID REFERENCES stores(id),
  partner_id          UUID REFERENCES delivery_partners(id),
  amount              NUMERIC(10,2) NOT NULL,
  type                VARCHAR(20) CHECK (type IN ('seller','delivery')),
  status              VARCHAR(20) DEFAULT 'pending'
                        CHECK (status IN ('pending','processing','paid','failed')),
  razorpay_payout_id  VARCHAR(100),
  period_start        DATE,
  period_end          DATE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  processed_at        TIMESTAMPTZ
);

-- ─────────────────────────────────────────────────────────────────────────────
-- AGENT VISITS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE agent_visits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id    UUID NOT NULL REFERENCES users(id),
  store_id    UUID REFERENCES stores(id),
  outcome     VARCHAR(30) CHECK (outcome IN (
                'onboarded','interested','not_interested','already_listed'
              )),
  notes       TEXT,
  visit_lat   NUMERIC(10,7),
  visit_lng   NUMERIC(10,7),
  visited_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX visits_agent_idx ON agent_visits(agent_id, visited_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- RESTOCK WISHLIST (notify me)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE restock_wishlist (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id),
  variant_id  UUID NOT NULL REFERENCES variants(id),
  notified    BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, variant_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- SEED: Default categories
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO categories (name, slug, sort_order) VALUES
  ('Kurtis', 'kurtis', 1),
  ('Sarees', 'sarees', 2),
  ('Lehengas', 'lehengas', 3),
  ('Tops & Tunics', 'tops-tunics', 4),
  ('Dresses', 'dresses', 5),
  ('Ethnic Wear', 'ethnic-wear', 6),
  ('Heels', 'heels', 7),
  ('Flats & Sandals', 'flats-sandals', 8),
  ('Sneakers', 'sneakers', 9),
  ('Bags & Purses', 'bags-purses', 10),
  ('Jewellery', 'jewellery', 11),
  ('Dupattas & Stoles', 'dupattas-stoles', 12),
  ('Men''s Ethnic', 'mens-ethnic', 13),
  ('Men''s Casual', 'mens-casual', 14),
  ('Accessories', 'accessories', 15);
