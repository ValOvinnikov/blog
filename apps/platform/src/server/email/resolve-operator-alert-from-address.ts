import { env } from '@platform/utils/env/env';

const DEFAULT_OPERATOR_ALERT_FROM_ADDRESS =
  'Tenant Alerts <onboarding@resend.dev>';

export const resolveOperatorAlertFromAddress = (): string =>
  env.OPERATOR_ALERT_FROM_ADDRESS ?? DEFAULT_OPERATOR_ALERT_FROM_ADDRESS;
