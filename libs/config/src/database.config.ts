import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  poolSize: parseInt(process.env.DATABASE_POOL_SIZE || '20', 10),
  ssl: process.env.NODE_ENV === 'production',
  logging: process.env.NODE_ENV === 'development',
}));
