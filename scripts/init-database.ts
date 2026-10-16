import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

config();

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [path.join(__dirname, '../libs/database/src/entities/**/*.entity{.ts,.js}')],
  synchronize: true, // This will auto-create tables
  logging: true,
  ssl:
    process.env.DATABASE_URL?.includes('sslmode=require') ||
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});

async function initDatabase() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database initialized successfully!');
    console.log('✅ All tables created!');

    await AppDataSource.destroy();
    console.log('Connection closed.');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase();
