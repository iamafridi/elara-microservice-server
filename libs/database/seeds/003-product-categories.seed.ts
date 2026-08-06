import { DataSource } from 'typeorm';

export async function seedProductCategories(dataSource: DataSource) {
  console.log('📦 Seeding product categories...');

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    await queryRunner.startTransaction();

    // Product categories for groceries and other items
    const categories = [
      // Grocery categories
      { name: 'Fruits & Vegetables', slug: 'fruits-vegetables', icon: '🥬', parent_id: null },
      { name: 'Meat & Poultry', slug: 'meat-poultry', icon: '🥩', parent_id: null },
      { name: 'Fish & Seafood', slug: 'fish-seafood', icon: '🐟', parent_id: null },
      { name: 'Dairy & Eggs', slug: 'dairy-eggs', icon: '🥛', parent_id: null },
      { name: 'Bakery', slug: 'bakery', icon: '🍞', parent_id: null },
      { name: 'Frozen Foods', slug: 'frozen', icon: '🧊', parent_id: null },
      { name: 'Beverages', slug: 'beverages', icon: '🥤', parent_id: null },
      { name: 'Snacks & Sweets', slug: 'snacks', icon: '🍫', parent_id: null },
      { name: 'Pantry Staples', slug: 'pantry', icon: '🏺', parent_id: null },
      { name: 'Health & Beauty', slug: 'health-beauty', icon: '💄', parent_id: null },
      { name: 'Household', slug: 'household', icon: '🧹', parent_id: null },
      { name: 'Baby & Kids', slug: 'baby-kids', icon: '👶', parent_id: null },

      // Halal specific
      { name: 'Halal Meat', slug: 'halal-meat', icon: '🥩', parent_id: null },
      { name: 'Halal Chicken', slug: 'halal-chicken', icon: '🍗', parent_id: null },
      { name: 'Halal Lamb', slug: 'halal-lamb', icon: '🐑', parent_id: null },
      { name: 'Halal Beef', slug: 'halal-beef', icon: '🐄', parent_id: null },

      // Flowers
      { name: 'Bouquets', slug: 'bouquets', icon: '💐', parent_id: null },
      { name: 'Roses', slug: 'roses', icon: '🌹', parent_id: null },
      { name: 'Seasonal Flowers', slug: 'seasonal-flowers', icon: '🌸', parent_id: null },
      { name: 'Plants', slug: 'plants', icon: '🪴', parent_id: null },
      { name: 'Gift Sets', slug: 'gift-sets', icon: '🎁', parent_id: null },

      // Fish
      { name: 'Fresh Fish', slug: 'fresh-fish', icon: '🐟', parent_id: null },
      { name: 'Shellfish', slug: 'shellfish', icon: '🦞', parent_id: null },
      { name: 'Smoked Fish', slug: 'smoked-fish', icon: '🐠', parent_id: null },
    ];

    for (const category of categories) {
      await queryRunner.query(
        `
        INSERT INTO product_categories (id, name, slug, icon, "parentId", "createdAt", "updatedAt")
        VALUES (uuid_generate_v4(), $1, $2, $3, $4, NOW(), NOW())
        ON CONFLICT (slug) DO NOTHING
        `,
        [category.name, category.slug, category.icon, category.parent_id],
      );
    }

    await queryRunner.commitTransaction();
    console.log(`✅ Seeded ${categories.length} product categories`);
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Error seeding product categories:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}
