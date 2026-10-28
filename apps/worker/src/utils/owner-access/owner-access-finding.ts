import {
  FINDING_KIND,
  FINDING_SEVERITY,
  FINDING_SOURCE,
  FINDING_STATUS,
} from '@blog/config/constants';
import {
  listFindingsForTenant,
  openFinding,
  resolveFinding,
} from '@blog/db/queries/findings';
import {
  OWNER_ACCESS_FINDING_AFTER_MS,
  OWNER_ACCESS_FINDING_IDENTIFIER,
  OWNER_ACCESS_LOG,
} from '@worker/constants/owner-access';
import { logger } from '@worker/utils/logger/logger';

export async function openOwnerAccessFindingOnceOverdue(
  tenantId: string,
  failingSince: number,
  error: string,
): Promise<void> {
  if (Date.now() - failingSince < OWNER_ACCESS_FINDING_AFTER_MS) return;

  const opened = await openFinding({
    tenantId,
    source: FINDING_SOURCE.TENANT_PROVISIONING,
    kind: FINDING_KIND.OWNER_ACCESS_CHECK_FAILED,
    identifier: OWNER_ACCESS_FINDING_IDENTIFIER,
    severity: FINDING_SEVERITY.WARNING,
    details: { error, failingSince: new Date(failingSince).toISOString() },
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
  const openFindings = await listFindingsForTenant(
    tenantId,
    FINDING_STATUS.OPEN,
  );
  const finding = openFindings.find(
    ({ kind }) => kind === FINDING_KIND.OWNER_ACCESS_CHECK_FAILED,
  );
  if (!finding) return;

  const resolved = await resolveFinding(finding.id);
  if (!resolved.ok) {
    logger.error(OWNER_ACCESS_LOG.FINDING_RESOLVE_FAILED, {
      tenantId,
      error: resolved.error,
    });
  }
}
