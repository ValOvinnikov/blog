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
  CHECKOUT_UNCONFIGURED: 'billing.checkout_unconfigured',
  CHECKOUT_PRICE_MISSING: 'billing.checkout_price_missing',
  CHECKOUT_FAILED: 'billing.checkout_failed',
  CHECKOUT_CUSTOMER_REPLACED: 'billing.checkout_customer_replaced',
  CHECKOUT_PROMO_REFUSED: 'billing.checkout_promo_refused',
  STRIPE_UNCONFIGURED: 'billing.stripe_unconfigured',
  OVERVIEW_FAILED: 'billing.overview_failed',
  NEXT_PAYMENT_FAILED: 'billing.next_payment_failed',
  PORTAL_FAILED: 'billing.portal_failed',
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

export const STRIPE_CHECKOUT_SESSION_STATUS = {
  OPEN: 'open',
} as const;

export const STRIPE_CUSTOMER_IDEMPOTENCY_PREFIX = 'tenant-customer-';

export const STRIPE_LIVE_SUBSCRIPTION_STATUSES = [
  STRIPE_SUBSCRIPTION_STATUS.ACTIVE,
  STRIPE_SUBSCRIPTION_STATUS.TRIALING,
  STRIPE_SUBSCRIPTION_STATUS.PAST_DUE,
] as const;

export const STRIPE_INVOICE_STATUS = {
  OPEN: 'open',
  PAID: 'paid',
  UNCOLLECTIBLE: 'uncollectible',
  VOID: 'void',
} as const;

export const BILLED_INVOICE_STATUSES = Object.values(STRIPE_INVOICE_STATUS);

export const STRIPE_ERROR_CODE = {
  INVOICE_UPCOMING_NONE: 'invoice_upcoming_none',
  RESOURCE_MISSING: 'resource_missing',
} as const;

export const BILLING_OVERVIEW_STATE = {
  NO_CUSTOMER: 'NO_CUSTOMER',
  LOADED: 'LOADED',
  UNAVAILABLE: 'UNAVAILABLE',
} as const;

export const BILLING_REFUSAL = {
  NO_CUSTOMER: 'NO_CUSTOMER',
} as const;

// Stripe's largest page, so one request lists eight years of monthly invoices.
export const BILLING_INVOICE_LIMIT = 100;

export const PLAN_CARD_ROW_COUNT = 2;

export const BILLING_GRACE = {
  START: 'START',
  END: 'END',
  KEEP: 'KEEP',
} as const;

export const MILLISECONDS_PER_SECOND = 1000;

export const STRIPE_SIGNATURE_HEADER = 'stripe-signature';

export const STRIPE_TENANT_METADATA_KEY = 'tenantId';

export type TBillingGrace = TValueOf<typeof BILLING_GRACE>;

export const BILLING_INTERVAL = {
  MONTHLY: 'MONTHLY',
  YEARLY: 'YEARLY',
} as const;

export type TBillingInterval = TValueOf<typeof BILLING_INTERVAL>;

export const UPGRADE_STATE = {
  AVAILABLE: 'AVAILABLE',
  SUBSCRIBED: 'SUBSCRIBED',
  NOT_OWNER: 'NOT_OWNER',
  UNAVAILABLE: 'UNAVAILABLE',
} as const;

export type TUpgradeState = TValueOf<typeof UPGRADE_STATE>;

export const UPGRADE_PAYMENT = {
  PAYMENT_PENDING: 'PAYMENT_PENDING',
} as const;

export type TUpgradeRefusal =
  | Exclude<TUpgradeState, typeof UPGRADE_STATE.AVAILABLE>
  | TValueOf<typeof UPGRADE_PAYMENT>;

export const UPGRADE_SEARCH_PARAM = {
  PROMO: 'promo',
  SESSION_ID: 'session_id',
} as const;

export const STRIPE_CHECKOUT_SESSION_ID_TEMPLATE = '{CHECKOUT_SESSION_ID}';

export const UPGRADE_POLL = {
  INTERVAL_MS: 2_000,
  MAX_TICKS: 30,
} as const;

export type TBilledInvoiceStatus = TValueOf<typeof STRIPE_INVOICE_STATUS>;

export type TBillingRefusal = TValueOf<typeof BILLING_REFUSAL>;
