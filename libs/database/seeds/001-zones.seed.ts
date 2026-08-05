import { DataSource } from 'typeorm';

export async function seedZones(dataSource: DataSource) {
  console.log('🌍 Seeding zones...');

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    await queryRunner.startTransaction();

    // Bangladesh Metropolitan Zones with PostGIS polygons (WGS 84: Longitude, Latitude)
    const zones = [
      {
        name: 'Dhaka North (Gulshan, Banani, Uttara, Mirpur)',
        polygon: 'POLYGON((90.350 23.780, 90.350 23.900, 90.450 23.900, 90.450 23.780, 90.350 23.780))',
        status: 'active',
      },
      {
        name: 'Dhaka South (Dhanmondi, Motijheel, Old Dhaka)',
        polygon: 'POLYGON((90.360 23.690, 90.360 23.775, 90.440 23.775, 90.440 23.690, 90.360 23.690))',
        status: 'active',
      },
      {
        name: 'Chittagong Central (Agrabad, GEC, Nasirabad)',
        polygon: 'POLYGON((91.780 22.300, 91.780 22.400, 91.860 22.400, 91.860 22.300, 91.780 22.300))',
        status: 'active',
      },
      {
        name: 'Sylhet Metro (Zindabazar, Amberkhana, Uposhohor)',
        polygon: 'POLYGON((91.840 24.870, 91.840 24.940, 91.910 24.940, 91.910 24.870, 91.840 24.870))',
        status: 'active',
      },
      {
        name: 'Rajshahi Metro',
        polygon: 'POLYGON((88.550 24.340, 88.550 24.400, 88.650 24.400, 88.650 24.340, 88.550 24.340))',
        status: 'active',
      },
      {
        name: 'Khulna Metro',
        polygon: 'POLYGON((89.510 22.790, 89.510 22.860, 89.580 22.860, 89.580 22.790, 89.510 22.790))',
        status: 'active',
      },
      {
        name: 'Cox\'s Bazar Tourism Belt',
        polygon: 'POLYGON((91.950 21.400, 91.950 21.470, 92.020 21.470, 92.020 21.400, 91.950 21.400))',
        status: 'active',
      },
      {
        name: 'Narayanganj Industrial Cluster',
        polygon: 'POLYGON((90.480 23.590, 90.480 23.650, 90.540 23.650, 90.540 23.590, 90.480 23.590))',
        status: 'active',
      },
      {
        name: 'Gazipur Tech & Garment Hub',
        polygon: 'POLYGON((90.380 23.960, 90.380 24.040, 90.460 24.040, 90.460 23.960, 90.380 23.960))',
        status: 'active',
      },
      {
        name: 'Comilla City',
        polygon: 'POLYGON((91.150 23.440, 91.150 23.490, 91.210 23.490, 91.210 23.440, 91.150 23.440))',
        status: 'active',
      },
    ];

    for (const zone of zones) {
      await queryRunner.query(
        `
        INSERT INTO zones (id, name, polygon, status, "createdAt", "updatedAt")
        VALUES (uuid_generate_v4(), $1, ST_GeogFromText($2), $3, NOW(), NOW())
        ON CONFLICT DO NOTHING
        `,
        [zone.name, zone.polygon, zone.status],
      );
    }

    // Get zone IDs for zone_modules
    const zonesResult = await queryRunner.query(`SELECT id, name FROM zones`);

    // Create zone_modules for each zone (Food, Grocery, Parcel, Halal, Flowers, Fish) in BDT (৳)
    const modules = [
      { name: 'food', delivery_fee: 60, commission_percent: 15 },
      { name: 'grocery', delivery_fee: 70, commission_percent: 10 },
      { name: 'parcel', delivery_fee: 80, commission_percent: 18 },
      { name: 'halal', delivery_fee: 70, commission_percent: 12 },
      { name: 'flowers', delivery_fee: 90, commission_percent: 15 },
      { name: 'fish', delivery_fee: 80, commission_percent: 12 },
    ];

    for (const zoneRow of zonesResult) {
      for (const module of modules) {
        await queryRunner.query(
          `
          INSERT INTO zone_modules (id, "zoneId", "moduleName", "isActive", "deliveryFee", "commissionPercent", "createdAt", "updatedAt")
          VALUES (uuid_generate_v4(), $1, $2, true, $3, $4, NOW(), NOW())
          ON CONFLICT DO NOTHING
          `,
          [zoneRow.id, module.name, module.delivery_fee, module.commission_percent],
        );
      }

      // Create dispatch_settings for each zone
      await queryRunner.query(
        `
        INSERT INTO dispatch_settings (id, "zoneId", "autoAssign", "riderRadiusKm", "priorityMatrix", "batchingEnabled", "createdAt", "updatedAt")
        VALUES (uuid_generate_v4(), $1, true, 5, $2, false, NOW(), NOW())
        ON CONFLICT DO NOTHING
        `,
        [
          zoneRow.id,
          JSON.stringify({
            food: 1,
            grocery: 2,
            flowers: 3,
            halal: 3,
            fish: 3,
            parcel: 4,
          }),
        ],
      );
    }

    await queryRunner.commitTransaction();
    console.log(`✅ Seeded ${zones.length} zones with modules and dispatch settings`);
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Error seeding zones:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}
