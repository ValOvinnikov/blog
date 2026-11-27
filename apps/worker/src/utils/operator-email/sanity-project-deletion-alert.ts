import type { TTenant } from '@shinefold/db/schema/tenants';
import { buildArchivedSanityProjectAlertEmail } from '@shinefold/email';
import {
  DEPROVISIONING_LOG,
  SANITY_MANAGE_PROJECT_URL,
} from '@worker/constants/deprovisioning';

import { sendOperatorEmail } from './send-operator-email';

export async function alertOperatorsToDeleteSanityProject(
  tenant: TTenant,
): Promise<void> {
  const { id: tenantId, name, sanityProjectId } = tenant;
  if (!sanityProjectId) return;

  const message = buildArchivedSanityProjectAlertEmail({
    tenantName: name,
    tenantId,
    sanityProjectId,
    manageUrl: `${SANITY_MANAGE_PROJECT_URL}${sanityProjectId}`,
  });
  await sendOperatorEmail(tenantId, message, {
    noRecipientsEvent: DEPROVISIONING_LOG.ALERT_NO_RECIPIENTS,
    sendFailedEvent: DEPROVISIONING_LOG.ALERT_SEND_FAILED,
  });
}
