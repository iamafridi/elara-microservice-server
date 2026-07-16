-- Create enum types for orders (drop if exists first)
DROP TYPE IF EXISTS module_type_enum CASCADE;
DROP TYPE IF EXISTS order_status_enum CASCADE;
DROP TYPE IF EXISTS payment_status_enum CASCADE;

CREATE TYPE module_type_enum AS ENUM('food', 'grocery', 'parcel', 'halal', 'flowers', 'fish', 'fashion', 'electronics', 'health', 'ride');
CREATE TYPE order_status_enum AS ENUM('pending', 'confirmed', 'preparing', 'ready', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'refunded');
CREATE TYPE payment_status_enum AS ENUM('pending', 'paid', 'failed', 'refunded');

-- Drop existing tables if they exist
DROP TABLE IF EXISTS "order_status_logs" CASCADE;
DROP TABLE IF EXISTS "order_items" CASCADE;
DROP TABLE IF EXISTS "orders" CASCADE;
DROP TABLE IF EXISTS "cart_items" CASCADE;
DROP TABLE IF EXISTS "carts" CASCADE;

-- Create orders table
CREATE TABLE "orders" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "deletedAt" TIMESTAMP WITH TIME ZONE,
  "orderNumber" character varying(50) NOT NULL UNIQUE,
  "userId" uuid NOT NULL,
  "merchantId" uuid,
  "riderId" uuid,
  "moduleType" module_type_enum NOT NULL,
  "status" order_status_enum NOT NULL DEFAULT 'pending',
  "subtotal" numeric(10, 2) NOT NULL,
  "deliveryFee" numeric(10, 2) NOT NULL DEFAULT 0,
  "serviceFee" numeric(10, 2) NOT NULL DEFAULT 0,
  "discount" numeric(10, 2) NOT NULL DEFAULT 0,
  "commissionPercent" numeric(5, 2) NOT NULL DEFAULT 15.0,
  "commissionAmount" numeric(10, 2) NOT NULL DEFAULT 0,
  "vatAmount" numeric(10, 2) NOT NULL DEFAULT 0,
  "total" numeric(10, 2) NOT NULL,
  "paymentStatus" payment_status_enum NOT NULL DEFAULT 'pending',
  "paymentIntentId" character varying(255),
  "deliveryAddress" character varying(500) NOT NULL,
  "deliveryLatitude" numeric(10, 7) NOT NULL,
  "deliveryLongitude" numeric(10, 7) NOT NULL,
  "deliveryNotes" character varying(500),
  "customerPhone" character varying(20),
  "customerName" character varying(100),
  "estimatedPrepTimeMinutes" integer,
  "estimatedDeliveryTimeMinutes" integer,
  "assignedAt" TIMESTAMP WITH TIME ZONE,
  "pickedAt" TIMESTAMP WITH TIME ZONE,
  "deliveredAt" TIMESTAMP WITH TIME ZONE,
  "cancelledAt" TIMESTAMP WITH TIME ZONE,
  "cancellationReason" character varying(500),
  "promoCode" character varying(500),
  "metadata" jsonb
);

-- Create order_items table
CREATE TABLE "order_items" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "deletedAt" TIMESTAMP WITH TIME ZONE,
  "orderId" uuid NOT NULL,
  "productId" uuid NOT NULL,
  "itemName" character varying(255) NOT NULL,
  "quantity" integer NOT NULL,
  "unitPrice" numeric(10, 2) NOT NULL,
  "totalPrice" numeric(10, 2) NOT NULL,
  "metadata" jsonb,
  FOREIGN KEY("orderId") REFERENCES "orders"("id") ON DELETE CASCADE
);

-- Create order_status_logs table
CREATE TABLE "order_status_logs" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "deletedAt" TIMESTAMP WITH TIME ZONE,
  "orderId" uuid NOT NULL,
  "status" order_status_enum NOT NULL,
  "notes" character varying(500),
  FOREIGN KEY("orderId") REFERENCES "orders"("id") ON DELETE CASCADE
);

-- Create carts table
CREATE TABLE "carts" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "deletedAt" TIMESTAMP WITH TIME ZONE,
  "userId" uuid NOT NULL,
  "merchantId" uuid NOT NULL,
  "totalItems" integer NOT NULL DEFAULT 0,
  "subtotal" numeric(10, 2) NOT NULL DEFAULT 0,
  "deliveryFee" numeric(10, 2) NOT NULL DEFAULT 0,
  "total" numeric(10, 2) NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP WITH TIME ZONE,
  "metadata" jsonb
);

-- Create cart_items table
CREATE TABLE "cart_items" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "deletedAt" TIMESTAMP WITH TIME ZONE,
  "cartId" uuid NOT NULL,
  "productId" uuid NOT NULL,
  "variantId" uuid,
  "quantity" integer NOT NULL,
  "price" numeric(10, 2) NOT NULL,
  "addons" jsonb,
  "metadata" jsonb,
  FOREIGN KEY("cartId") REFERENCES "carts"("id") ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX "IDX_orders_orderNumber" ON "orders" ("orderNumber");
CREATE INDEX "IDX_orders_userId" ON "orders" ("userId");
CREATE INDEX "IDX_orders_merchantId" ON "orders" ("merchantId");
CREATE INDEX "IDX_orders_riderId" ON "orders" ("riderId");
CREATE INDEX "IDX_orders_status" ON "orders" ("status");
CREATE INDEX "IDX_orders_moduleType" ON "orders" ("moduleType");
CREATE INDEX "IDX_orders_createdAt" ON "orders" ("createdAt");
CREATE INDEX "IDX_order_items_orderId" ON "order_items" ("orderId");
CREATE INDEX "IDX_order_items_productId" ON "order_items" ("productId");
CREATE INDEX "IDX_order_status_logs_orderId" ON "order_status_logs" ("orderId");
CREATE INDEX "IDX_carts_userId" ON "carts" ("userId");
CREATE INDEX "IDX_carts_merchantId" ON "carts" ("merchantId");
CREATE INDEX "IDX_cart_items_cartId" ON "cart_items" ("cartId");
CREATE INDEX "IDX_cart_items_productId" ON "cart_items" ("productId");
