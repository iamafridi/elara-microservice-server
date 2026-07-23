-- Insert a test product
INSERT INTO products (
  "merchantId", "categoryId", name, description, price, "isActive", "stockEnabled", "stockCount"
) VALUES (
  'c1141a79-8d9e-43a6-87ab-a70257dcc822',
  (SELECT id FROM product_categories LIMIT 1),
  'Test Product - Apples',
  'Fresh red apples',
  99.99,
  true,
  true,
  100
);

-- Get the inserted product ID
SELECT id, name, price, "merchantId" FROM products WHERE name = 'Test Product - Apples' LIMIT 1;
