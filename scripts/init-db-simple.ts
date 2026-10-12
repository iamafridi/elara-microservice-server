import { Pool } from 'pg';
import { config } from 'dotenv';

config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initDatabase() {
  const client = await pool.connect();

  try {
    console.log('Starting database initialization...');

    await client.query('BEGIN');

    console.log('Creating extensions...');
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await client.query(`CREATE EXTENSION IF NOT EXISTS "postgis"`);

    // Since TypeORM synchronize has issues with enum ordering,
    // we'll use TypeORM but with a minimal approach
    // Just create the database and let each service handle its own tables

    console.log('✅ Database base setup complete!');
    console.log('Note: Tables will be created by each microservice on first run');

    await client.query('COMMIT');

    console.log('✅ All done!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

initDatabase().catch(() => process.exit(1));
