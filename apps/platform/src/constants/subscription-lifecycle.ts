export const SUBSCRIPTION_LIFECYCLE_LOG = {
  COLLECTION_FAILED: 'billing.subscription_collection_failed',
  CANCEL_FAILED: 'billing.subscription_cancel_failed',
  LIVE_CHECK_FAILED: 'billing.live_subscription_check_failed',
} as const;

export const STRIPE_PAUSE_BEHAVIOR = {
  VOID: 'void',
} as const;

// Stripe unsets an optional parameter that is sent as an empty string.
export const STRIPE_UNSET_PARAM = '';
