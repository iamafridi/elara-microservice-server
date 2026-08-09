import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { seedZones } from './001-zones.seed';
import { seedMerchantCategories } from './002-merchant-categories.seed';
// import { seedProductCategories } from './003-product-categories.seed'; // Skip - merchant-specific
import { seedJobCategories } from './004-job-categories.seed';
import { seedAdminUsers } from './005-admin-users.seed';
import { seedAppSettings } from './006-app-settings.seed';

config();

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ['libs/database/src/entities/**/*.entity.ts'],
  synchronize: false,
  logging: false,
});

async function runSeeds() {
  console.log('🌱 Starting database seeding...\n');
  console.log('📍 Database:', process.env.DATABASE_URL?.split('@')[1] || 'Unknown');
  console.log('─'.repeat(60));

  try {
    console.log('\n🔄 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Connected successfully\n');

    // Run all seed files in order
    await seedZones(dataSource);
    await seedMerchantCategories(dataSource);
    // Skip product_categories - merchant-specific, created when merchants add products
    await seedJobCategories(dataSource);
    await seedAdminUsers(dataSource);
    await seedAppSettings(dataSource);

    console.log('\n' + '─'.repeat(60));
    console.log('✅ All seeds completed successfully!');
    console.log('─'.repeat(60));

    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

runSeeds();
