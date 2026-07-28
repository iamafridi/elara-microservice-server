import { v4 as uuidv4 } from 'uuid';

/**
 * Create a test user
 */
export const createTestUser = (overrides: Partial<any> = {}) => ({
  id: uuidv4(),
  name: 'Test User',
  email: `test${Date.now()}@example.com`,
  phone: `+4470000${Math.floor(Math.random() * 100000)}`,
  passwordHash: '$2b$10$hashedpassword',
  role: 'user',
  status: 'active',
  emailVerified: true,
  phoneVerified: true,
  profilePicture: null,
  referralCode: `TEST${Math.random().toString(36).substring(7).toUpperCase()}`,
  referredByUserId: null,
  firebaseUid: null,
  googleId: null,
  appleId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
});

/**
 * Create a test merchant
 */
export const createTestMerchant = (overrides: Partial<any> = {}) => ({
  id: uuidv4(),
  user_id: uuidv4(),
  category_id: uuidv4(),
  business_name: 'Test Merchant',
  slug: `test-merchant-${Date.now()}`,
  description: 'A test merchant for testing',
  email: `merchant${Date.now()}@example.com`,
  phone: `+4470000${Math.floor(Math.random() * 100000)}`,
  address: '123 Test Street',
  city: 'London',
  postcode: 'SW1A 1AA',
  latitude: 51.5074,
  longitude: -0.1278,
  logo: null,
  cover_image: null,
  status: 'active',
  open_status: 'open',
  rating: 4.5,
  total_orders: 0,
  total_reviews: 0,
  delivery_enabled: true,
  pickup_enabled: true,
  min_order_value: 10.0,
  delivery_fee: 2.5,
  free_delivery_threshold: 20.0,
  estimated_prep_time: 30,
  is_featured: false,
  stripe_account_id: null,
  bank_details: null,
  documents_verified: false,
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null,
  ...overrides,
});

/**
 * Create a test product
 */
export const createTestProduct = (overrides: Partial<any> = {}) => ({
  id: uuidv4(),
  merchant_id: uuidv4(),
  category_id: null,
  name: 'Test Product',
  description: 'A test product for testing',
  price: 10.99,
  image_url: null,
  images: null,
  is_active: true,
  is_featured: false,
  stock_enabled: false,
  stock_count: null,
  is_weight_based: false,
  weight_kg: null,
  weight_unit: null,
  sort_order: 0,
  metadata: null,
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null,
  ...overrides,
});

/**
 * Create a test order
 */
export const createTestOrder = (overrides: Partial<any> = {}) => ({
  id: uuidv4(),
  customer_id: uuidv4(),
  merchant_id: uuidv4(),
  rider_id: null,
  module_type: 'food',
  order_number: `ORD${Date.now()}`,
  status: 'pending',
  payment_status: 'pending',
  subtotal: 20.0,
  delivery_fee: 2.5,
  service_fee: 1.0,
  discount: 0,
  total: 23.5,
  delivery_address: '123 Test Street, London, SW1A 1AA',
  delivery_latitude: 51.5074,
  delivery_longitude: -0.1278,
  special_instructions: null,
  scheduled_at: null,
  confirmed_at: null,
  preparing_at: null,
  ready_at: null,
  assigned_at: null,
  picked_up_at: null,
  delivered_at: null,
  cancelled_at: null,
  metadata: null,
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null,
  ...overrides,
});

/**
 * Create a test rider
 */
export const createTestRider = (overrides: Partial<any> = {}) => ({
  id: uuidv4(),
  user_id: uuidv4(),
  name: 'Test Rider',
  phone: `+4470000${Math.floor(Math.random() * 100000)}`,
  vehicle_type: 'motorbike',
  vehicle_number: 'TEST123',
  vehicle_make: 'Honda',
  vehicle_model: 'PCX125',
  status: 'active',
  rating: 4.8,
  total_deliveries: 0,
  total_reviews: 0,
  documents_verified: true,
  online_status: 'offline',
  current_latitude: null,
  current_longitude: null,
  last_location_update: null,
  profile_picture: null,
  stripe_account_id: null,
  bank_details: null,
  metadata: null,
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null,
  ...overrides,
});

/**
 * Create a test job
 */
export const createTestJob = (overrides: Partial<any> = {}) => ({
  id: uuidv4(),
  customer_id: uuidv4(),
  category_id: uuidv4(),
  title: 'Test Job',
  description: 'A test job for testing',
  budget_type: 'fixed',
  budget_amount: 50.0,
  location: 'London, SW1A 1AA',
  latitude: 51.5074,
  longitude: -0.1278,
  status: 'posted',
  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  images: null,
  skills_required: null,
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null,
  ...overrides,
});

/**
 * Create JWT token for testing
 */
export const createTestJWT = (payload: any = {}) => {
  const defaultPayload = {
    sub: uuidv4(),
    email: 'test@example.com',
    role: 'user',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    ...payload,
  };

  // For testing, return a simple base64 encoded payload
  // In real tests, use the actual JWT service
  return Buffer.from(JSON.stringify(defaultPayload)).toString('base64');
};
