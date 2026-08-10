import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

export const dataSourceOptions = {
  type: 'postgres' as const,
  url: process.env.DATABASE_URL,
  entities: ['libs/database/src/entities/**/*.entity.ts'],
  migrations: ['libs/database/src/migrations/**/*.ts'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  extra: {
    max: parseInt(process.env.DATABASE_POOL_SIZE || '20', 10),
  },
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
