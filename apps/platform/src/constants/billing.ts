import type { TValueOf } from '@blog/config/utils';

export const BILLING_LOG = {
  WEBHOOK_SECRET_MISSING: 'billing.webhook_secret_missing',
  WEBHOOK_SIGNATURE_INVALID: 'billing.webhook_signature_invalid',
  WEBHOOK_HANDLER_FAILED: 'billing.webhook_handler_failed',
  TENANT_NOT_FOUND: 'billing.tenant_not_found',
  TENANT_CONFLICT: 'billing.tenant_conflict',
  TENANT_NOT_WRITABLE: 'billing.tenant_not_writable',
  PRICE_UNKNOWN: 'billing.price_unknown',
  SUBSCRIPTION_SUPERSEDED: 'billing.subscription_superseded',
  RECEIPT_UNCONFIGURED: 'billing.receipt_unconfigured',
  RECEIPT_OWNER_MISSING: 'billing.receipt_owner_missing',
  RECEIPT_FAILED: 'billing.receipt_failed',
} as const;

export const STRIPE_EVENT_TYPE = {
  SUBSCRIPTION_CREATED: 'customer.subscription.created',
  SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
  INVOICE_PAID: 'invoice.paid',
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
} as const;

export const STRIPE_SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  TRIALING: 'trialing',
  PAST_DUE: 'past_due',
  CANCELED: 'canceled',
  UNPAID: 'unpaid',
} as const;

export const STRIPE_LIVE_SUBSCRIPTION_STATUSES: readonly string[] = [
  STRIPE_SUBSCRIPTION_STATUS.ACTIVE,
  STRIPE_SUBSCRIPTION_STATUS.TRIALING,
  STRIPE_SUBSCRIPTION_STATUS.PAST_DUE,
];

export const BILLING_GRACE = {
  START: 'START',
  END: 'END',
  KEEP: 'KEEP',
} as const;

export const MILLISECONDS_PER_SECOND = 1000;

export const STRIPE_SIGNATURE_HEADER = 'stripe-signature';

export const STRIPE_TENANT_METADATA_KEY = 'tenantId';

export type TBillingGrace = TValueOf<typeof BILLING_GRACE>;
