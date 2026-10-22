import type { TTenant } from '@blog/db/schema/tenants';
import { buildArchivedSanityProjectAlertEmail } from '@blog/email';
import {
  DEPROVISIONING_ALERT_NO_RECIPIENTS_EVENT,
  DEPROVISIONING_ALERT_SEND_FAILED_EVENT,
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
    noRecipientsEvent: DEPROVISIONING_ALERT_NO_RECIPIENTS_EVENT,
    sendFailedEvent: DEPROVISIONING_ALERT_SEND_FAILED_EVENT,
  });
}
