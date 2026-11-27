export const DEPROVISIONING_AUDIT_VIA = 'deprovision-tenant-worker';
export const SANITY_MANAGE_PROJECT_URL =
  'https://www.sanity.io/manage/project/';
export const DEPROVISIONING_LOG = {
  START_FAILED: 'deprovisioning.start_failed',
  STEP_FAILED: 'deprovisioning.step_failed',
  RUN_FAILED: 'deprovisioning.run_failed',
  TOKEN_REVOKE_FAILED: 'deprovisioning.token_revoke_failed',
  ALERT_NO_RECIPIENTS: 'deprovisioning.alert_no_recipients',
  ALERT_SEND_FAILED: 'deprovisioning.alert_send_failed',
} as const;
