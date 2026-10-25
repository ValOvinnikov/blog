export const NEWSLETTER_OUTCOME = {
  ALREADY_SUBSCRIBED: 'ALREADY_SUBSCRIBED',
} as const;

export const NEWSLETTER_SUBSCRIPTION_ACTION = {
  UNSUBSCRIBE: 'UNSUBSCRIBE',
  RESEND: 'RESEND',
} as const;

export const NEWSLETTER_LOG = {
  SUBSCRIBE_FAILED: 'newsletter.subscribe_failed',
  SUBSCRIBE_TENANT_NOT_ACTIVE: 'newsletter.subscribe_tenant_not_active',
  SUBSCRIBE_CAPABILITY_DISABLED: 'newsletter.subscribe_capability_disabled',
  SUBSCRIBED_COOKIE_SET_FAILED: 'newsletter.subscribed_cookie_set_failed',
  SUBSCRIBED_COOKIE_CLEAR_FAILED: 'newsletter.subscribed_cookie_clear_failed',
  UNSUBSCRIBE_FAILED: 'newsletter.unsubscribe_failed',
  UNSUBSCRIBE_TENANT_UNRESOLVED: 'newsletter.unsubscribe_tenant_unresolved',
  CONFIRMATION_RESEND_FAILED: 'newsletter.confirmation_resend_failed',
  RESEND_CONFIRMATION_TENANT_NOT_ACTIVE:
    'newsletter.resend_confirmation_tenant_not_active',
} as const;
