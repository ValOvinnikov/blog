export const STRIPE_EVENT_TYPE = {
  SUBSCRIPTION_CREATED: 'customer.subscription.created',
  SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
  INVOICE_PAID: 'invoice.paid',
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
  PRICE_CREATED: 'price.created',
  PRICE_UPDATED: 'price.updated',
  PRICE_DELETED: 'price.deleted',
  PROMOTION_CODE_CREATED: 'promotion_code.created',
  PROMOTION_CODE_UPDATED: 'promotion_code.updated',
  COUPON_DELETED: 'coupon.deleted',
} as const;
