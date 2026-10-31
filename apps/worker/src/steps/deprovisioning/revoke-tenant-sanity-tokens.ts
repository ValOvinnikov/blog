import type { TTenant } from '@blog/db/schema/tenants';
import {
  deleteSanityRobotToken,
  listSanityRobotTokens,
  type TSanityRobotTokenSummary,
} from '@blog/db/utils/sanity-management-client/sanity-robot-tokens';
import {
  isProvisionedRobotToken,
  SANITY_MANAGEMENT_TOKEN_LABEL,
} from '@blog/db/utils/sanity-management-client/sanity-token-labels';
import { sanitizeLogMessage } from '@blog/insight';
import { DEPROVISIONING_TOKEN_REVOKE_FAILED_EVENT } from '@worker/constants/deprovisioning';
import { logger } from '@worker/utils/logger/logger';
import { requireTenantManagementToken } from '@worker/utils/tenant-management-token/tenant-management-token';

function isManagementRobotToken({ label }: TSanityRobotTokenSummary): boolean {
  return label === SANITY_MANAGEMENT_TOKEN_LABEL;
}

// The management token revokes itself, so it goes last.
function inRevocationOrder(
  robots: TSanityRobotTokenSummary[],
): TSanityRobotTokenSummary[] {
  const provisioned = robots.filter(isProvisionedRobotToken);
  return [
    ...provisioned.filter((robot) => !isManagementRobotToken(robot)),
    ...provisioned.filter(isManagementRobotToken),
  ];
}

// Tolerant like the CLI step: a stray unrevoked token is a follow-up cleanup, never a reason to stop the teardown.
export async function revokeTenantSanityTokens(tenant: TTenant): Promise<void> {
  const { id: tenantId, sanityProjectId: projectId } = tenant;
  if (!projectId) return;

  try {
    const token = await requireTenantManagementToken(tenantId);
    const robots = await listSanityRobotTokens({ token, projectId });
    for (const robot of inRevocationOrder(robots)) {
      await deleteSanityRobotToken({ token, projectId, robotId: robot.id });
    }
  } catch (error) {
    logger.error(DEPROVISIONING_TOKEN_REVOKE_FAILED_EVENT, {
      tenantId,
      error: sanitizeLogMessage(error),
    });
  }
}
