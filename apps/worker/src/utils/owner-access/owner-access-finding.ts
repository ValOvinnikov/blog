import {
  FINDING_KIND,
  FINDING_SEVERITY,
  FINDING_SOURCE,
  FINDING_STATUS,
} from '@blog/config/constants';
import type { TMaybeUndefined } from '@blog/config/types';
import {
  getFindingDetails,
  listFindingsForTenant,
  openFinding,
  resolveFinding,
} from '@blog/db/queries/findings';
import type { TFindingSummary } from '@blog/db/schema/findings';
import type { TTenant } from '@blog/db/schema/tenants';
import {
  OWNER_ACCESS_FINDING_AFTER_MS,
  OWNER_ACCESS_FINDING_IDENTIFIER,
  OWNER_ACCESS_LOG,
} from '@worker/constants/owner-access';
import { logger } from '@worker/utils/logger/logger';
import { z } from 'zod';

const failureCountSchema = z.object({
  failureCount: z.number().int().nonnegative().catch(0),
});

async function findOpenOwnerAccessFinding(
  tenantId: string,
): Promise<TMaybeUndefined<TFindingSummary>> {
  const openFindings = await listFindingsForTenant(
    tenantId,
    FINDING_STATUS.OPEN,
  );
  return openFindings.find(
    ({ kind }) => kind === FINDING_KIND.OWNER_ACCESS_CHECK_FAILED,
  );
}

async function previousFailureCount(
  tenantId: string,
  finding: TFindingSummary,
): Promise<number> {
  const details = await getFindingDetails(tenantId, finding.id);
  const parsed = failureCountSchema.safeParse(details ?? {});
  return parsed.success ? parsed.data.failureCount : 0;
}

export async function recordOwnerAccessFailure(
  tenant: TTenant,
  error: string,
  failingSince: Date,
): Promise<void> {
  const now = new Date();
  if (now.getTime() - failingSince.getTime() < OWNER_ACCESS_FINDING_AFTER_MS) {
    return;
  }

  const tenantId = tenant.id;
  const finding = await findOpenOwnerAccessFinding(tenantId);
  const failureCount = finding
    ? (await previousFailureCount(tenantId, finding)) + 1
    : 1;
  const opened = await openFinding({
    tenantId,
    source: FINDING_SOURCE.TENANT_PROVISIONING,
    kind: FINDING_KIND.OWNER_ACCESS_CHECK_FAILED,
    identifier: OWNER_ACCESS_FINDING_IDENTIFIER,
    severity: FINDING_SEVERITY.WARNING,
    details: {
      error,
      failureCount,
      firstFailedAt: failingSince.toISOString(),
      lastFailedAt: now.toISOString(),
    },
  });
  if (!opened.ok) {
    logger.error(OWNER_ACCESS_LOG.FINDING_OPEN_FAILED, {
      tenantId,
      error: opened.error,
    });
  }
}

export async function resolveOwnerAccessFinding(
  tenantId: string,
): Promise<void> {
  const finding = await findOpenOwnerAccessFinding(tenantId);
  if (!finding) return;

  const resolved = await resolveFinding(finding.id);
  if (!resolved.ok) {
    logger.error(OWNER_ACCESS_LOG.FINDING_RESOLVE_FAILED, {
      tenantId,
      error: resolved.error,
    });
  }
}
