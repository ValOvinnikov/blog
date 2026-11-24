export const NEWSLETTER_OUTCOME = {
  ALREADY_SUBSCRIBED: 'ALREADY_SUBSCRIBED',
} as const;

export const NEWSLETTER_SUBSCRIPTION_ACTION = {
  UNSUBSCRIBE: 'UNSUBSCRIBE',
  RESEND: 'RESEND',
} as const;

export const NEWSLETTER_LOG = {
  MODULE_FETCH_FAILED: 'newsletter_module.fetch_failed',
  SUBSCRIBE_FAILED: 'newsletter.subscribe_failed',
  SUBSCRIBE_TENANT_NOT_ACTIVE: 'newsletter.subscribe_tenant_not_active',
  SUBSCRIBE_CAPABILITY_DISABLED: 'newsletter.subscribe_capability_disabled',
  SUBSCRIBED_COOKIE_SET_FAILED: 'newsletter.subscribed_cookie_set_failed',
  SUBSCRIBED_COOKIE_CLEAR_FAILED: 'newsletter.subscribed_cookie_clear_failed',
  GATE_STATUS_FETCH_FAILED: 'newsletter.gate_status_fetch_failed',
  UNSUBSCRIBE_FAILED: 'newsletter.unsubscribe_failed',
  UNSUBSCRIBE_TENANT_UNRESOLVED: 'newsletter.unsubscribe_tenant_unresolved',
  UNSUBSCRIBE_KEY_MISSING: 'newsletter.unsubscribe_key_missing',
  UNSUBSCRIBE_LINK_FAILED: 'newsletter.unsubscribe_link_failed',
  UNSUBSCRIBE_LINK_TENANT_UNRESOLVED:
    'newsletter.unsubscribe_link_tenant_unresolved',
  CONFIRMATION_RESEND_FAILED: 'newsletter.confirmation_resend_failed',
  RESEND_CONFIRMATION_TENANT_NOT_ACTIVE:
    'newsletter.resend_confirmation_tenant_not_active',
  LINK_LOCALE_TENANT_LOOKUP_FAILED:
    'newsletter.link_locale_tenant_lookup_failed',
} as const;
