import { config } from 'dotenv';

// Load environment variables from .env.test or .env
config({ path: '.env.test' });
config();

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';

  // Increase timeout for e2e tests
  jest.setTimeout(30000);
});

afterAll(async () => {
  // Global cleanup
  await new Promise((resolve) => setTimeout(resolve, 500));
});
