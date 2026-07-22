-- Create zones table first (needed by merchants)
CREATE TABLE IF NOT EXISTS zones (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "deletedAt" TIMESTAMP WITH TIME ZONE,
  name character varying(100) NOT NULL,
  polygon text NOT NULL,
  status character varying NOT NULL DEFAULT 'active',
  metadata jsonb
);

-- Create merchants table
CREATE TABLE IF NOT EXISTS merchants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "deletedAt" TIMESTAMP WITH TIME ZONE,
  "userId" uuid NOT NULL,
  "storeName" character varying(255) NOT NULL,
  slug character varying(255) NOT NULL UNIQUE,
  "categoryId" uuid NOT NULL,
  status character varying DEFAULT 'active'
);

-- Create product_categories table
CREATE TABLE IF NOT EXISTS product_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "deletedAt" TIMESTAMP WITH TIME ZONE,
  name character varying(255) NOT NULL,
  "isActive" boolean DEFAULT true
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "deletedAt" TIMESTAMP WITH TIME ZONE,
  "merchantId" uuid NOT NULL,
  "categoryId" uuid,
  name character varying(255) NOT NULL,
  description text,
  price numeric(10, 2) NOT NULL,
  "imageUrl" character varying(500),
  images text,
  "isActive" boolean DEFAULT true,
  "isFeatured" boolean DEFAULT false,
  "stockEnabled" boolean DEFAULT false,
  "stockCount" integer,
  "isWeightBased" boolean DEFAULT false,
  "weightKg" numeric(10, 3),
  "weightUnit" character varying(20),
  "sortOrder" integer DEFAULT 0,
  metadata jsonb
);

-- Insert test zone
INSERT INTO zones (name, polygon, status) VALUES ('Test Zone', 'POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))', 'active') ON CONFLICT DO NOTHING;

-- Insert test product category
INSERT INTO product_categories (name, "isActive") VALUES ('Test Category', true) ON CONFLICT DO NOTHING;

-- Insert test merchant
INSERT INTO merchants ("userId", "storeName", slug, "categoryId", status)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Test Merchant',
  'test-merchant-001',
  (SELECT id FROM product_categories LIMIT 1),
  'active'
) ON CONFLICT(slug) DO NOTHING;

-- Get merchant ID for testing
SELECT id as merchant_id, "storeName" FROM merchants LIMIT 1;
