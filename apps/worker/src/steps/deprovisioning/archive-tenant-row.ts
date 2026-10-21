import { AUDIT_ACTION } from '@blog/config/constants';
import { archiveTenant } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import { recordDeprovisioningAuditEvent } from '@worker/utils/deprovisioning-report/deprovisioning-report';

export async function archiveTenantRow(
  tenant: TTenant,
  runId: string,
): Promise<void> {
  const { id: tenantId, deprovisionedAt } = tenant;
  if (deprovisionedAt) return;

  const result = await archiveTenant(tenantId);
  if (!result.ok) {
    throw new Error(
      `Tenant "${tenantId}" could not be archived (${result.error}).`,
    );
  }

  await recordDeprovisioningAuditEvent({
    tenantId,
    runId,
    action: AUDIT_ACTION.DEPROVISIONED,
  });
}
