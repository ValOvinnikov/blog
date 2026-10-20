import { HTTP_METHOD, type TOperatorAlertBody } from '@blog/config/constants';
import { sanitizeLogMessage } from '@blog/insight';
import {
  OPERATOR_ALERT_PATH,
  OPERATOR_ALERT_TIMEOUT_MS,
} from '@worker/constants/operator-alert';
import { env } from '@worker/utils/env/env';
import { logger } from '@worker/utils/logger/logger';

export async function postOperatorAlert(
  body: TOperatorAlertBody,
): Promise<boolean> {
  const { ADMIN_APP_BASE_URL, OPERATOR_ALERT_SECRET } = env;
  const { kind, tenantId } = body;
  if (!ADMIN_APP_BASE_URL || !OPERATOR_ALERT_SECRET) {
    logger.error('operator_alert.not_configured', { kind, tenantId });
    return false;
  }

  try {
    const response = await fetch(
      new URL(OPERATOR_ALERT_PATH, ADMIN_APP_BASE_URL),
      {
        method: HTTP_METHOD.POST,
        headers: {
          Authorization: `Bearer ${OPERATOR_ALERT_SECRET}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(OPERATOR_ALERT_TIMEOUT_MS),
      },
    );
    if (!response.ok) {
      logger.error('operator_alert.rejected', {
        kind,
        tenantId,
        status: response.status,
      });
      return false;
    }
    return true;
  } catch (error) {
    logger.error('operator_alert.failed', {
      kind,
      tenantId,
      error: sanitizeLogMessage(error),
    });
    return false;
  }
}
