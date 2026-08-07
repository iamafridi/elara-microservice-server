import { DataSource } from 'typeorm';

export async function seedJobCategories(dataSource: DataSource) {
  console.log('🔧 Seeding job categories...');

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    await queryRunner.startTransaction();

    // 13 main categories with subcategories (Tailored for urban Bangladesh Home Sheba)
    const categories = [
      {
        name: 'AC & Appliance Servicing',
        slug: 'ac-appliance-servicing',
        icon: '❄️',
        subcategories: [
          'AC Master Servicing',
          'AC Jet Wash',
          'AC Gas Refill',
          'Refrigerator Repair',
          'Washing Machine Repair',
          'Microwave & Oven Repair',
          'Water Purifier Servicing',
        ],
      },
      {
        name: 'Handyman & Repairs',
        slug: 'handyman',
        icon: '🔨',
        subcategories: [
          'Furniture Assembly',
          'Picture Hanging',
          'Shelf Installation',
          'Door Repair',
          'Window Repair',
          'General Repairs',
          'TV Mounting',
        ],
      },
      {
        name: 'Cleaning',
        slug: 'cleaning',
        icon: '🧹',
        subcategories: [
          'House Cleaning',
          'Deep Cleaning',
          'End of Tenancy Cleaning',
          'Carpet Cleaning',
          'Window Cleaning',
          'Office Cleaning',
          'Oven Cleaning',
          'After Builders Cleaning',
        ],
      },
      {
        name: 'Gardening & Landscaping',
        slug: 'gardening',
        icon: '🌿',
        subcategories: [
          'Lawn Mowing',
          'Garden Maintenance',
          'Hedge Trimming',
          'Tree Pruning',
          'Landscaping',
          'Garden Design',
          'Patio Cleaning',
          'Weed Control',
        ],
      },
      {
        name: 'Moving & Delivery',
        slug: 'moving',
        icon: '📦',
        subcategories: [
          'House Moving',
          'Furniture Delivery',
          'Van Hire with Driver',
          'Man and Van',
          'Packing Services',
          'Storage Collection',
          'Waste Removal',
        ],
      },
      {
        name: 'Pet Care',
        slug: 'pet-care',
        icon: '🐕',
        subcategories: [
          'Dog Walking',
          'Pet Sitting',
          'Pet Grooming',
          'Pet Training',
          'Vet Transport',
        ],
      },
      {
        name: 'Beauty & Wellness',
        slug: 'beauty',
        icon: '💆',
        subcategories: [
          'Hairdressing (Mobile)',
          'Barber (Mobile)',
          'Massage',
          'Manicure/Pedicure',
          'Makeup Artist',
          'Personal Training',
          'Yoga Instructor',
        ],
      },
      {
        name: 'Photography & Videography',
        slug: 'photography',
        icon: '📸',
        subcategories: [
          'Event Photography',
          'Portrait Photography',
          'Wedding Photography',
          'Product Photography',
          'Video Production',
          'Drone Photography',
        ],
      },
      {
        name: 'Events & Entertainment',
        slug: 'events',
        icon: '🎉',
        subcategories: [
          'DJ Services',
          'Party Catering',
          'Event Planning',
          'Face Painting',
          'Magician',
          'Balloon Decoration',
          'Bouncy Castle Hire',
        ],
      },
      {
        name: 'Tutoring & Education',
        slug: 'tutoring',
        icon: '📚',
        subcategories: [
          'Maths Tutor',
          'English Tutor',
          'Science Tutor',
          'Music Lessons',
          'Language Tutor',
          'Driving Instructor',
          'Exam Preparation',
        ],
      },
      {
        name: 'IT & Tech Support',
        slug: 'it-support',
        icon: '💻',
        subcategories: [
          'Computer Repair',
          'Phone Repair',
          'Network Setup',
          'Software Installation',
          'Data Recovery',
          'Smart Home Setup',
          'Website Development',
        ],
      },
      {
        name: 'Car Services',
        slug: 'car-services',
        icon: '🚗',
        subcategories: [
          'Car Wash (Mobile)',
          'Car Valet',
          'Tyre Change',
          'Car Battery Replacement',
          'Car Inspection',
        ],
      },
      {
        name: 'Home Repairs & Maintenance',
        slug: 'home-repairs',
        icon: '🏠',
        subcategories: [
          'Plumbing',
          'Electrical Work',
          'Painting & Decorating',
          'Locksmith',
          'Appliance Repair',
          'Roofing',
          'Flooring Installation',
          'Plastering',
        ],
      },
      {
        name: 'Other Services',
        slug: 'other',
        icon: '⚙️',
        subcategories: [
          'Personal Assistant',
          'Shopping Services',
          'Elderly Care',
          'Babysitting',
          'Meal Prep',
          'Laundry & Ironing',
          'Custom Requests',
        ],
      },
    ];

    for (const category of categories) {
      // Insert main category
      const mainCategoryResult = await queryRunner.query(
        `
        INSERT INTO job_categories (id, name, slug, icon, "parentId", "createdAt", "updatedAt")
        VALUES (uuid_generate_v4(), $1, $2, $3, NULL, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
        `,
        [category.name, category.slug, category.icon],
      );

      const parentId = mainCategoryResult[0]?.id;

      if (parentId) {
        // Insert subcategories
        for (const subcategory of category.subcategories) {
          const subcategorySlug = `${category.slug}-${subcategory
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')}`;

          await queryRunner.query(
            `
            INSERT INTO job_categories (id, name, slug, icon, "parentId", "createdAt", "updatedAt")
            VALUES (uuid_generate_v4(), $1, $2, NULL, $3, NOW(), NOW())
            ON CONFLICT (slug) DO NOTHING
            `,
            [subcategory, subcategorySlug, parentId],
          );
        }
      }
    }

    const totalSubcategories = categories.reduce((sum, cat) => sum + cat.subcategories.length, 0);

    await queryRunner.commitTransaction();
    console.log(
      `✅ Seeded ${categories.length} main job categories and ${totalSubcategories} subcategories`,
    );
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Error seeding job categories:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}
