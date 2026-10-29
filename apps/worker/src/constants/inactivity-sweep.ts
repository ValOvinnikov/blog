export const INACTIVITY_SWEEP_LOG = {
  NOT_CONFIGURED: 'inactivity_sweep.not_configured',
  FAILED: 'inactivity_sweep.failed',
  STAGE_FAILED: 'inactivity_sweep.stage_failed',
  OWNER_MISSING: 'inactivity_sweep.owner_missing',
  PLATFORM_TENANT_SKIPPED: 'inactivity_sweep.platform_tenant_skipped',
  ALERT_NO_RECIPIENTS: 'inactivity_sweep.alert_no_recipients',
  EMAIL_SEND_FAILED: 'inactivity_sweep.email_send_failed',
} as const;
