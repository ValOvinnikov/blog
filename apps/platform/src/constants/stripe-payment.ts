export const STRIPE_PAYMENT_BEHAVIOR = {
  PENDING_IF_INCOMPLETE: 'pending_if_incomplete',
} as const;

export const STRIPE_PAYMENT_INTENT_STATUS = {
  REQUIRES_ACTION: 'requires_action',
  REQUIRES_PAYMENT_METHOD: 'requires_payment_method',
  PROCESSING: 'processing',
  SUCCEEDED: 'succeeded',
} as const;

export const STRIPE_PAYMENT_GOING_THROUGH = [
  STRIPE_PAYMENT_INTENT_STATUS.PROCESSING,
  STRIPE_PAYMENT_INTENT_STATUS.SUCCEEDED,
] as const;

export const STRIPE_JS_ERROR_TYPE = {
  CARD_ERROR: 'card_error',
} as const;

export const STRIPE_JS_ERROR_CODE = {
  AUTHENTICATION_FAILURE: 'payment_intent_authentication_failure',
} as const;

export const STRIPE_PENDING_PAYMENT_EXPAND = [
  'latest_invoice.confirmation_secret',
  'latest_invoice.payments',
];

export const STRIPE_INVOICE_PAYMENTS_EXPAND = ['payments'];

export const STRIPE_BILLING_REASON = {
  SUBSCRIPTION_CYCLE: 'subscription_cycle',
  SUBSCRIPTION_UPDATE: 'subscription_update',
} as const;

export const PAYMENT_FAILURE = {
  DECLINED: 'DECLINED',
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
} as const;
