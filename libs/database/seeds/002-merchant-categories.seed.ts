import { DataSource } from 'typeorm';

export async function seedMerchantCategories(dataSource: DataSource) {
  console.log('🏪 Seeding merchant categories...');

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    await queryRunner.startTransaction();

    // Main categories for merchants
    const categories = [
      // Food categories (Bengal & Global)
      { name: 'Kacchi & Biryani', slug: 'kacchi-biryani', icon: '🍲', parentId: null },
      { name: 'Traditional Bengali & Rice', slug: 'traditional-bengali', icon: '🍛', parentId: null },
      { name: 'Cha, Snacks & Street Eats', slug: 'cha-and-street-eats', icon: '☕', parentId: null },
      { name: 'Fast Food & Burgers', slug: 'fast-food', icon: '🍔', parentId: null },
      { name: 'Pizza & Bakery', slug: 'pizza', icon: '🍕', parentId: null },
      { name: 'Chinese & Pan-Asian', slug: 'chinese', icon: '🥡', parentId: null },
      { name: 'Kebabs & Grills', slug: 'kebab', icon: '🍢', parentId: null },
      { name: 'Desserts & Sweets (Misti)', slug: 'desserts', icon: '🍨', parentId: null },
      { name: 'Breakfast & Paratha', slug: 'breakfast', icon: '🍳', parentId: null },
      { name: 'Healthy & Salads', slug: 'healthy', icon: '🥗', parentId: null },
      { name: 'Halal Certified', slug: 'halal', icon: '☪️', parentId: null },

      // Grocery & Bazaar categories
      { name: 'Supermarket (Shwapno/Unimart)', slug: 'supermarket', icon: '🛒', parentId: null },
      { name: 'Local Mudir Dokan', slug: 'convenience-store', icon: '🏪', parentId: null },
      { name: 'Organic & Farm Fresh', slug: 'organic', icon: '🌿', parentId: null },
      { name: 'Artisan Bakery', slug: 'bakery', icon: '🥖', parentId: null },

      // Specialty categories
      { name: 'Halal Meat & Butcher', slug: 'halal-butcher', icon: '🥩', parentId: null },
      { name: 'River Fish & Fishmonger (Padma Ilish)', slug: 'fishmonger', icon: '🐟', parentId: null },
      { name: 'Florist & Plants', slug: 'florist', icon: '💐', parentId: null },
    ];

    for (const category of categories) {
      await queryRunner.query(
        `
        INSERT INTO merchant_categories (id, name, slug, icon, "parentId", "createdAt", "updatedAt")
        VALUES (uuid_generate_v4(), $1, $2, $3, $4, NOW(), NOW())
        ON CONFLICT (slug) DO NOTHING
        `,
        [category.name, category.slug, category.icon, category.parentId],
      );
    }

    await queryRunner.commitTransaction();
    console.log(`✅ Seeded ${categories.length} merchant categories`);
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Error seeding merchant categories:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}
