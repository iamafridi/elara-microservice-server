/**
 * Typesense Collection Schemas
 */

export const PRODUCTS_COLLECTION = 'products';
export const MERCHANTS_COLLECTION = 'merchants';
export const JOBS_COLLECTION = 'jobs';

export const productsSchema = {
  name: PRODUCTS_COLLECTION,
  fields: [
    { name: 'id', type: 'string' },
    { name: 'name', type: 'string' },
    { name: 'description', type: 'string' },
    { name: 'price', type: 'float' },
    { name: 'merchantId', type: 'string', facet: true },
    { name: 'merchantName', type: 'string' },
    { name: 'categoryId', type: 'string', facet: true },
    { name: 'categoryName', type: 'string' },
    { name: 'images', type: 'string[]' },
    { name: 'isActive', type: 'bool', facet: true },
    { name: 'isFeatured', type: 'bool', facet: true },
    { name: 'inStock', type: 'bool', facet: true },
    { name: 'stockCount', type: 'int32' },
    { name: 'rating', type: 'float', optional: true },
    { name: 'reviewCount', type: 'int32', optional: true },
    { name: 'createdAt', type: 'int64' },
  ],
  default_sorting_field: 'createdAt',
};

export const merchantsSchema = {
  name: MERCHANTS_COLLECTION,
  fields: [
    { name: 'id', type: 'string' },
    { name: 'storeName', type: 'string' },
    { name: 'description', type: 'string' },
    { name: 'categoryId', type: 'string', facet: true },
    { name: 'categoryName', type: 'string' },
    { name: 'address', type: 'string' },
    { name: 'city', type: 'string', facet: true },
    { name: 'postcode', type: 'string' },
    { name: 'location', type: 'geopoint' }, // [lat, lng]
    { name: 'rating', type: 'float' },
    { name: 'totalReviews', type: 'int32' },
    { name: 'deliveryFee', type: 'float' },
    { name: 'minOrderAmount', type: 'float' },
    { name: 'estimatedDeliveryTime', type: 'int32' },
    { name: 'cuisineTypes', type: 'string[]', facet: true },
    { name: 'isOpen', type: 'bool', facet: true },
    { name: 'isActive', type: 'bool', facet: true },
    { name: 'isFeatured', type: 'bool', facet: true },
    { name: 'logo', type: 'string', optional: true },
    { name: 'banner', type: 'string', optional: true },
    { name: 'createdAt', type: 'int64' },
  ],
  default_sorting_field: 'rating',
};

export const jobsSchema = {
  name: JOBS_COLLECTION,
  fields: [
    { name: 'id', type: 'string' },
    { name: 'title', type: 'string' },
    { name: 'description', type: 'string' },
    { name: 'categoryId', type: 'string', facet: true },
    { name: 'categoryName', type: 'string' },
    { name: 'subcategoryId', type: 'string', facet: true, optional: true },
    { name: 'subcategoryName', type: 'string', optional: true },
    { name: 'customerId', type: 'string' },
    { name: 'customerName', type: 'string' },
    { name: 'location', type: 'geopoint' }, // [lat, lng]
    { name: 'address', type: 'string' },
    { name: 'city', type: 'string', facet: true },
    { name: 'postcode', type: 'string' },
    { name: 'budgetType', type: 'string', facet: true }, // 'fixed' | 'hourly' | 'negotiable'
    { name: 'budgetAmount', type: 'float', optional: true },
    { name: 'status', type: 'string', facet: true }, // 'open' | 'in_progress' | 'completed' | 'cancelled'
    { name: 'urgency', type: 'string', facet: true, optional: true }, // 'low' | 'medium' | 'high'
    { name: 'scheduledDate', type: 'int64', optional: true },
    { name: 'quoteCount', type: 'int32' },
    { name: 'images', type: 'string[]', optional: true },
    { name: 'createdAt', type: 'int64' },
  ],
  default_sorting_field: 'createdAt',
};
