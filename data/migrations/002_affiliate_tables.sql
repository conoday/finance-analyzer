-- Migration: 002_affiliate_tables.sql
-- Adds affiliate_products and link_reports tables for the /belanja AI shopping feature.

-- Affiliate products table
CREATE TABLE IF NOT EXISTS affiliate_products (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    price       NUMERIC,
    platform    TEXT NOT NULL CHECK (platform IN ('shopee', 'tiktokshop', 'alfagift', 'other')),
    affiliate_url TEXT NOT NULL,
    image_url   TEXT,
    description TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_affiliate_products_updated_at ON affiliate_products;
CREATE TRIGGER set_affiliate_products_updated_at
BEFORE UPDATE ON affiliate_products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index for fast platform+name lookups used by /belanja command
CREATE INDEX IF NOT EXISTS idx_affiliate_products_platform_active
    ON affiliate_products (platform, is_active);

-- Broken link reports from users
CREATE TABLE IF NOT EXISTS link_reports (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id  UUID REFERENCES affiliate_products(id) ON DELETE CASCADE,
    reported_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reason      TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_link_reports_product_id ON link_reports (product_id);
