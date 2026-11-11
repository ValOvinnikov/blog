export const RESEND_WEBHOOK_HEADER = {
  ID: 'svix-id',
  TIMESTAMP: 'svix-timestamp',
  SIGNATURE: 'svix-signature',
} as const;

export const RESEND_DELIVERY_EVENT_TYPE = {
  DELIVERED: 'email.delivered',
  BOUNCED: 'email.bounced',
  COMPLAINED: 'email.complained',
} as const;

export const EMAIL_USAGE_LOG = {
  WEBHOOK_SECRET_MISSING: 'email_usage.webhook_secret_missing',
  WEBHOOK_SIGNATURE_INVALID: 'email_usage.webhook_signature_invalid',
  WEBHOOK_EVENT_MALFORMED: 'email_usage.webhook_event_malformed',
  WEBHOOK_SITE_UNKNOWN: 'email_usage.webhook_site_unknown',
  WEBHOOK_SITE_TAG_INVALID: 'email_usage.webhook_site_tag_invalid',
  DELIVERY_OUTCOME_RECORD_FAILED: 'email_usage.delivery_outcome_record_failed',
  SEND_COUNT_FAILED: 'email_usage.send_count_failed',
} as const;
