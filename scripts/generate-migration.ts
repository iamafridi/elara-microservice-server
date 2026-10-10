import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../libs/database/src/data-source';

const dataSource = new DataSource(dataSourceOptions);

async function generateMigration() {
  const migrationName = process.argv[2];

  if (!migrationName) {
    console.error('Please provide a migration name');
    process.exit(1);
  }

  try {
    await dataSource.initialize();
    console.log('Data Source initialized');

    // Generate migration
    const result = await dataSource.driver.createSchemaBuilder().log();
    console.log('Migration generated successfully:', migrationName);
    console.log(result);

    await dataSource.destroy();
  } catch (error) {
    console.error('Error generating migration:', error);
    process.exit(1);
  }
}

generateMigration();
