import {
  FINDING_KIND,
  FINDING_SEVERITY,
  FINDING_SOURCE,
} from '@shinefold/config/constants';
import { getFindingDetails, openFinding } from '@shinefold/db/queries/findings';
import type { TFindingSummary } from '@shinefold/db/schema/findings';
import type { TTenant } from '@shinefold/db/schema/tenants';
import {
  OWNER_ACCESS_FINDING_AFTER_MS,
  OWNER_ACCESS_FINDING_IDENTIFIER,
  OWNER_ACCESS_LOG,
} from '@worker/constants/owner-access';
import {
  findOpenFinding,
  resolveOpenFinding,
} from '@worker/utils/finding/find-open-finding';
import { logger } from '@worker/utils/logger/logger';
import { z } from 'zod';

const failureCountSchema = z.object({
  failureCount: z.number().int().nonnegative().catch(0),
});

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
  const finding = await findOpenFinding(
    tenantId,
    FINDING_KIND.OWNER_ACCESS_CHECK_FAILED,
  );
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
  await resolveOpenFinding(tenantId, FINDING_KIND.OWNER_ACCESS_CHECK_FAILED);
}
