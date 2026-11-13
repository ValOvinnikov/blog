import { GRACE_EMAIL } from '@blog/db/constants';

export const DOWNGRADE_GRACE_LOG = {
  FAILED: 'downgrade_grace.failed',
  STEP_FAILED: 'downgrade_grace.step_failed',
  OWNER_MISSING: 'downgrade_grace.owner_missing',
  SUBDOMAIN_MISSING: 'downgrade_grace.subdomain_missing',
  EMAIL_SEND_FAILED: 'downgrade_grace.email_send_failed',
} as const;

export const DOWNGRADE_GRACE_STEP = {
  TRIAL_END: 'TRIAL_END',
  GRACE_END: 'GRACE_END',
  ...GRACE_EMAIL,
} as const;
