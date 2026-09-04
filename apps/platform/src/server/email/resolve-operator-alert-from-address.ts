const DEFAULT_OPERATOR_ALERT_FROM_ADDRESS =
  'Tenant Alerts <onboarding@resend.dev>';

/**
 * Resolves the operator-alert email's `from` address: the configured
 * `OPERATOR_ALERT_FROM_ADDRESS` env var when set, falling back to Resend's
 * own shared testing sender otherwise. Pure so it's testable without mocking
 * `env`/Resend.
 */
export const resolveOperatorAlertFromAddress = (
  configuredFromAddress: string | undefined,
): string => {
  return configuredFromAddress ?? DEFAULT_OPERATOR_ALERT_FROM_ADDRESS;
};
