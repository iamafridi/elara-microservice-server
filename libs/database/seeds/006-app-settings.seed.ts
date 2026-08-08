import { DataSource } from 'typeorm';

export async function seedAppSettings(dataSource: DataSource) {
  console.log('⚙️  Seeding app settings...');

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    await queryRunner.startTransaction();

    const settings = [
      // General settings
      { key: 'app_name', value: 'Elara', description: 'Application name (Elara BD Super App)' },
      { key: 'app_version', value: '1.0.0', description: 'Current app version' },
      { key: 'currency_code', value: 'BDT', description: 'Primary currency code' },
      { key: 'currency_symbol', value: '৳', description: 'Primary currency symbol' },
      { key: 'maintenance_mode', value: 'false', description: 'Enable maintenance mode' },
      { key: 'support_email', value: 'support@elara.com.bd', description: 'Support email address' },
      { key: 'support_phone', value: '+880 9612 000000', description: 'Support hotline number (Bangladesh)' },

      // Commission & Fees
      { key: 'food_commission', value: '15', description: 'Food delivery commission (%)' },
      { key: 'grocery_commission', value: '10', description: 'Daily grocery commission (%)' },
      { key: 'parcel_commission', value: '18', description: 'Express courier commission (%)' },
      { key: 'halal_commission', value: '12', description: 'Halal butcher commission (%)' },
      { key: 'flowers_commission', value: '15', description: 'Flowers commission (%)' },
      { key: 'fish_commission', value: '12', description: 'Fresh Fish (Padma/Meghna) commission (%)' },
      { key: 'jobtap_commission', value: '15', description: 'JobTap Home Sheba commission (%)' },

      { key: 'service_fee', value: '15.00', description: 'Platform service fee (BDT ৳)' },
      { key: 'vat_rate', value: '5', description: 'Local restaurant/service VAT rate (%)' },
      { key: 'min_order_value', value: '150.00', description: 'Minimum order value (BDT ৳)' },

      // Delivery settings
      { key: 'default_delivery_radius', value: '6', description: 'Default delivery radius (km)' },
      { key: 'rider_acceptance_timeout', value: '25', description: 'Rider acceptance timeout (seconds)' },
      { key: 'location_update_interval', value: '3', description: 'GPS location update interval (seconds)' },
      { key: 'max_delivery_distance', value: '20', description: 'Maximum delivery distance (km)' },

      // JobTap settings
      { key: 'tasker_radius', value: '15', description: 'Tasker work area radius (km)' },
      { key: 'job_deposit_percent', value: '30', description: 'Job deposit percentage (%)' },
      { key: 'job_quote_timeout', value: '24', description: 'Job quote timeout (hours)' },
      { key: 'max_tasker_notifications', value: '20', description: 'Max taskers to notify per job' },

      // Rider earnings (BDT ৳)
      { key: 'rider_base_fee', value: '50.00', description: 'Rider base fee per delivery (BDT ৳)' },
      { key: 'rider_per_km_fee', value: '15.00', description: 'Rider per km fee (BDT ৳)' },
      { key: 'rider_min_payout', value: '300.00', description: 'Minimum payout amount (BDT ৳)' },

      // Order timeouts
      { key: 'merchant_accept_timeout', value: '5', description: 'Merchant must accept within (minutes)' },
      { key: 'food_prep_time', value: '25', description: 'Average food prep time (minutes)' },
      { key: 'grocery_prep_time', value: '15', description: 'Average grocery prep time (minutes)' },

      // User settings
      { key: 'max_addresses', value: '6', description: 'Maximum addresses per user' },
      { key: 'referral_credit', value: '100.00', description: 'Referral credit amount (BDT ৳)' },
      { key: 'first_order_discount', value: '15', description: 'First order discount (%)' },

      // Media settings
      { key: 'max_image_size', value: '5', description: 'Maximum image size (MB)' },
      { key: 'max_video_size', value: '200', description: 'Maximum video size (MB)' },
      { key: 'max_video_duration', value: '30', description: 'Maximum video duration (seconds)' },

      // Security settings
      { key: 'max_login_attempts', value: '5', description: 'Max login attempts before lockout' },
      { key: 'otp_expiry', value: '10', description: 'OTP expiry time (minutes)' },
      { key: 'otp_length', value: '6', description: 'OTP code length' },
      { key: 'session_timeout', value: '30', description: 'Session timeout (days)' },

      // Rating settings
      { key: 'min_rating', value: '1', description: 'Minimum rating value' },
      { key: 'max_rating', value: '5', description: 'Maximum rating value' },
      { key: 'enable_merchant_reviews', value: 'true', description: 'Enable merchant reviews' },
      { key: 'enable_rider_reviews', value: 'true', description: 'Enable rider reviews' },
      { key: 'enable_tasker_reviews', value: 'true', description: 'Enable tasker reviews' },

      // Feature flags & Local Gateways
      { key: 'enable_wallet', value: 'true', description: 'Enable Elara wallet feature' },
      { key: 'enable_scheduled_orders', value: 'true', description: 'Enable scheduled orders' },
      { key: 'enable_multi_cart', value: 'true', description: 'Enable multi-vendor cart' },
      { key: 'enable_rider_feed', value: 'true', description: 'Enable TapMate social rider feed' },
      { key: 'enable_chat', value: 'true', description: 'Enable in-app chat' },
      { key: 'enable_bkash', value: 'true', description: 'Enable bKash Direct Checkout & Tokenized Payment' },
      { key: 'enable_nagad', value: 'true', description: 'Enable Nagad Postal & Mobile Gateway' },
      { key: 'enable_sslcommerz', value: 'true', description: 'Enable SSLCommerz Card Gateway (Visa/Mastercard)' },
      { key: 'enable_open_banking', value: 'false', description: 'Enable Open Banking payments' },
    ];

    for (const setting of settings) {
      await queryRunner.query(
        `
        INSERT INTO app_settings (id, key, value, description, "createdAt", "updatedAt")
        VALUES (uuid_generate_v4(), $1, $2, $3, NOW(), NOW())
        ON CONFLICT (key) DO NOTHING
        `,
        [setting.key, setting.value, setting.description],
      );
    }

    await queryRunner.commitTransaction();
    console.log(`✅ Seeded ${settings.length} app settings`);
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Error seeding app settings:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}
