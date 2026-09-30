export interface ElaraEvent<T = any> {
  eventId: string;
  eventName: string;
  timestamp: Date;
  source: string;
  data: T;
  userId?: string;
  correlationId?: string;
}

export enum EventNames {
  // Order Events
  ORDER_CREATED = 'order.created',
  ORDER_STATUS_CHANGED = 'order.status_changed',
  ORDER_ASSIGNED_TO_RIDER = 'order.assigned_to_rider',
  ORDER_PICKED_UP = 'order.picked_up',
  ORDER_DELIVERED = 'order.delivered',
  ORDER_CANCELLED = 'order.cancelled',
  ORDER_REFUNDED = 'order.refunded',

  // Job Events
  JOB_POSTED = 'job.posted',
  JOB_QUOTE_SUBMITTED = 'job.quote_submitted',
  JOB_QUOTE_ACCEPTED = 'job.quote_accepted',
  JOB_ASSIGNED = 'job.assigned',
  JOB_IN_PROGRESS = 'job.in_progress',
  JOB_COMPLETED_BY_TASKER = 'job.completed_by_tasker',
  JOB_COMPLETED_BY_CUSTOMER = 'job.completed_by_customer',
  JOB_CANCELLED = 'job.cancelled',

  // Payment Events
  PAYMENT_CONFIRMED = 'payment.confirmed',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_DEPOSIT_RECEIVED = 'payment.deposit_received',
  PAYMENT_RELEASED = 'payment.released',
  PAYOUT_PROCESSED = 'payout.processed',
  REFUND_ISSUED = 'refund.issued',

  // Rider Events
  RIDER_WENT_ONLINE = 'rider.went_online',
  RIDER_WENT_OFFLINE = 'rider.went_offline',
  RIDER_LOCATION_UPDATED = 'rider.location_updated',
  RIDER_VIDEO_UPLOADED = 'rider.video_uploaded',
  RIDER_REVIEWED = 'rider.reviewed',

  // User Events
  USER_REGISTERED = 'user.registered',
  USER_VERIFIED = 'user.verified',
  USER_DOCUMENT_UPLOADED = 'user.document_uploaded',

  // Tasker Events
  TASKER_REGISTERED = 'tasker.registered',
  TASKER_VERIFIED = 'tasker.verified',
  TASKER_REVIEWED = 'tasker.reviewed',

  // Product Events
  PRODUCT_CREATED = 'product.created',
  PRODUCT_UPDATED = 'product.updated',
  PRODUCT_STOCK_CHANGED = 'product.stock_changed',

  // Media Events
  MEDIA_UPLOADED = 'media.uploaded',
  MEDIA_PROCESSED = 'media.processed',
}
