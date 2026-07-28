import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

config();

/**
 * Create a test database connection
 */
export async function createTestDatabase(): Promise<DataSource> {
  const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    url: process.env.DATABASE_URL || 'postgresql://elara:elara123@localhost:5432/elara_test',
    entities: ['libs/database/src/entities/**/*.entity.ts'],
    synchronize: true, // Auto-sync schema in test environment
    dropSchema: false, // Don't drop schema automatically
    logging: false,
  };

  const dataSource = new DataSource(dataSourceOptions);
  await dataSource.initialize();

  return dataSource;
}

/**
 * Clean database tables for testing
 */
export async function cleanDatabase(dataSource: DataSource, tables: string[]): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    await queryRunner.startTransaction();

    // Disable foreign key checks
    await queryRunner.query('SET session_replication_role = replica;');

    // Truncate tables
    for (const table of tables) {
      await queryRunner.query(`TRUNCATE TABLE "${table}" CASCADE;`);
    }

    // Re-enable foreign key checks
    await queryRunner.query('SET session_replication_role = DEFAULT;');

    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}

/**
 * Close test database connection
 */
export async function closeTestDatabase(dataSource: DataSource): Promise<void> {
  if (dataSource?.isInitialized) {
    await dataSource.destroy();
  }
}
