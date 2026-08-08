import { DataSource } from 'typeorm';
import * as argon2 from 'argon2';

export async function seedAdminUsers(dataSource: DataSource) {
  console.log('👤 Seeding admin users...');

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    await queryRunner.startTransaction();

    // Default password: Admin@123 (CHANGE IN PRODUCTION!)
    const defaultPassword = await argon2.hash('Admin@123');

    const adminUsers = [
      {
        name: 'Super Admin',
        email: 'superadmin@elara.com.bd',
        role: 'super_admin',
        permissions: JSON.stringify({
          users: ['read', 'write', 'delete'],
          merchants: ['read', 'write', 'delete'],
          riders: ['read', 'write', 'delete'],
          taskers: ['read', 'write', 'delete'],
          orders: ['read', 'write', 'delete'],
          jobs: ['read', 'write', 'delete'],
          zones: ['read', 'write', 'delete'],
          settings: ['read', 'write'],
          analytics: ['read'],
        }),
      },
      {
        name: 'Finance Admin',
        email: 'finance@elara.com.bd',
        role: 'finance',
        permissions: JSON.stringify({
          users: ['read'],
          merchants: ['read'],
          riders: ['read'],
          taskers: ['read'],
          orders: ['read'],
          jobs: ['read'],
          payouts: ['read', 'write'],
          refunds: ['read', 'write'],
          transactions: ['read'],
          analytics: ['read'],
        }),
      },
      {
        name: 'Support Admin',
        email: 'support@elara.com.bd',
        role: 'support',
        permissions: JSON.stringify({
          users: ['read', 'write'],
          merchants: ['read'],
          riders: ['read'],
          taskers: ['read'],
          orders: ['read', 'write'],
          jobs: ['read'],
          tickets: ['read', 'write'],
        }),
      },
      {
        name: 'Operations Admin',
        email: 'operations@elara.com.bd',
        role: 'operations',
        permissions: JSON.stringify({
          users: ['read'],
          merchants: ['read', 'write'],
          riders: ['read', 'write'],
          orders: ['read', 'write'],
          zones: ['read', 'write'],
          dispatch: ['read', 'write'],
        }),
      },
      {
        name: 'Marketing Admin',
        email: 'marketing@elara.com.bd',
        role: 'marketing',
        permissions: JSON.stringify({
          users: ['read'],
          promos: ['read', 'write'],
          banners: ['read', 'write'],
          notifications: ['read', 'write'],
          analytics: ['read'],
        }),
      },
      {
        name: 'Content Admin',
        email: 'content@elara.com.bd',
        role: 'content',
        permissions: JSON.stringify({
          landing_pages: ['read', 'write'],
          blog: ['read', 'write'],
          faqs: ['read', 'write'],
        }),
      },
    ];

    for (const admin of adminUsers) {
      await queryRunner.query(
        `
        INSERT INTO admin_users (id, name, email, "passwordHash", role, permissions, "createdAt", "updatedAt")
        VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, NOW(), NOW())
        ON CONFLICT (email) DO NOTHING
        `,
        [admin.name, admin.email, defaultPassword, admin.role, admin.permissions],
      );
    }

    await queryRunner.commitTransaction();
    console.log(`✅ Seeded ${adminUsers.length} admin users`);
    console.log('⚠️  Default password: Admin@123 (CHANGE IN PRODUCTION!)');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Error seeding admin users:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}
