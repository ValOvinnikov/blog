import { AUDIT_ACTION } from '@shinefold/config/constants';
import { archiveTenant } from '@shinefold/db/queries/tenants';
import type { TTenant } from '@shinefold/db/schema/tenants';
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
