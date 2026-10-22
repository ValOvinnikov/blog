import { listSuperadminEmails } from '@blog/db/queries/admins';
import type { TTenant } from '@blog/db/schema/tenants';
import { buildArchivedSanityProjectAlertEmail, sendEmail } from '@blog/email';
import { sanitizeLogMessage } from '@blog/insight';
import {
  DEFAULT_OPERATOR_ALERT_FROM_ADDRESS,
  DEPROVISIONING_ALERT_NO_RECIPIENTS_EVENT,
  DEPROVISIONING_ALERT_SEND_FAILED_EVENT,
  SANITY_MANAGE_PROJECT_URL,
} from '@worker/constants/deprovisioning';
import { env } from '@worker/utils/env/env';
import { logger } from '@worker/utils/logger/logger';

export async function alertOperatorsToDeleteSanityProject(
  tenant: TTenant,
): Promise<void> {
  const { id: tenantId, name, sanityProjectId } = tenant;
  if (!sanityProjectId) return;

  const recipients = await listSuperadminEmails();
  if (recipients.length === 0) {
    logger.warn(DEPROVISIONING_ALERT_NO_RECIPIENTS_EVENT, { tenantId });
    return;
  }

  const message = buildArchivedSanityProjectAlertEmail({
    tenantName: name,
    tenantId,
    sanityProjectId,
    manageUrl: `${SANITY_MANAGE_PROJECT_URL}${sanityProjectId}`,
  });
  const from =
    env.OPERATOR_ALERT_FROM_ADDRESS ?? DEFAULT_OPERATOR_ALERT_FROM_ADDRESS;

  const results = await Promise.allSettled(
    recipients.map((to) => sendEmail({ to, from, ...message })),
  );
  for (const result of results) {
    if (result.status === 'rejected') {
      logger.error(DEPROVISIONING_ALERT_SEND_FAILED_EVENT, {
        tenantId,
        error: sanitizeLogMessage(result.reason),
      });
    }
  }
}
