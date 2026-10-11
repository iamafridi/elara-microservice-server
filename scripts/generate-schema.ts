import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

config();

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ['libs/database/src/entities/**/*.entity.ts'],
  synchronize: false,
  logging: true,
});

async function generateSchema() {
  try {
    console.log('🔄 Connecting to database...');
    await dataSource.initialize();

    console.log('✅ Connected successfully');
    console.log('📝 Generating schema SQL...');

    // Get the SQL queries that would be executed by synchronize
    const sqlInMemory = await dataSource.driver.createSchemaBuilder().log();

    // Write SQL to file
    const sqlQueries = sqlInMemory.upQueries.map(q => q.query).join(';\n\n') + ';';

    const migrationPath = path.join(
      __dirname,
      '../libs/database/src/migrations',
      `${Date.now()}-CompleteSchema.sql`
    );

    fs.writeFileSync(migrationPath, sqlQueries);

    console.log(`✅ Schema SQL generated: ${migrationPath}`);
    console.log(`📊 Total queries: ${sqlInMemory.upQueries.length}`);

    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

generateSchema();
