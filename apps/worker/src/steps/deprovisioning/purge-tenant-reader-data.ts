import { AUDIT_ACTION } from '@blog/config/constants';
import { purgeTenantReaderData as purgeReaderDataRows } from '@blog/db/queries/reader-data';
import { recordDeprovisioningAuditEvent } from '@worker/utils/deprovisioning-report/deprovisioning-report';

export async function purgeTenantReaderData(
  tenantId: string,
  runId: string,
): Promise<void> {
  const counts = await purgeReaderDataRows(tenantId);

  await recordDeprovisioningAuditEvent({
    tenantId,
    runId,
    action: AUDIT_ACTION.READER_DATA_PURGED,
    details: counts,
  });
}
