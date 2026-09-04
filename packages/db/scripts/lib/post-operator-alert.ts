import type { TOperatorAlertBody } from '@blog/config/constants';

const OPERATOR_ALERT_PATH = '/api/internal/operator-alert';

/**
 * Reports an operator-alert event to `apps/platform`, which resolves
 * recipients and renders the notification — this script sends facts only.
 * Never throws: a notification failure must never fail the sweep reporting
 * it, so an unset config, a non-2xx response and a rejected `fetch` are all
 * swallowed after a single log line.
 */
export async function postOperatorAlert(
  body: TOperatorAlertBody,
): Promise<void> {
  const adminAppBaseUrl = process.env['ADMIN_APP_BASE_URL'];
  const operatorAlertSecret = process.env['OPERATOR_ALERT_SECRET'];

  if (!adminAppBaseUrl || !operatorAlertSecret) {
    console.log(
      `post-operator-alert: ADMIN_APP_BASE_URL or OPERATOR_ALERT_SECRET is unset — skipping operator alert for kind "${body.kind}".`,
    );
    return;
  }

  try {
    const response = await fetch(
      new URL(OPERATOR_ALERT_PATH, adminAppBaseUrl),
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${operatorAlertSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      console.error(
        `post-operator-alert: platform responded ${response.status} for kind "${body.kind}".`,
      );
    }
  } catch (error) {
    console.error(
      `post-operator-alert: failed to reach the platform for kind "${body.kind}": ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
