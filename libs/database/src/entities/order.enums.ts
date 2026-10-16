export enum ModuleType {
  FOOD = 'food',
  GROCERY = 'grocery',
  PARCEL = 'parcel',
  HALAL = 'halal',
  FLOWERS = 'flowers',
  FISH = 'fish',
  FASHION = 'fashion',
  ELECTRONICS = 'electronics',
  HEALTH = 'health',
  RIDE = 'ride',
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  ASSIGNED = 'assigned',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}
