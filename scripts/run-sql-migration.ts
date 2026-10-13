import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

config();

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: false,
  logging: true,
});

async function runMigration() {
  try {
    console.log('Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Connected!');

    console.log('Reading migration file...');
    const sqlPath = path.join(__dirname, '../libs/database/src/migrations/1704067200000-InitialSchema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing migration...');
    await AppDataSource.query(sql);

    console.log('✅ Migration completed successfully!');

    await AppDataSource.destroy();
    console.log('Connection closed.');
  } catch (error) {
    console.error('❌ Error running migration:', error);
    process.exit(1);
  }
}

runMigration();
