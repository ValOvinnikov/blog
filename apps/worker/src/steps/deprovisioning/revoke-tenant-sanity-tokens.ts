import { getTenantSanityManagementCredentials } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import {
  missingManagementRobotIdMessage,
  robotsInRevocationOrder,
} from '@blog/db/utils/sanity-management-client/sanity-robot-revocation';
import {
  deleteSanityRobotToken,
  listSanityRobotTokens,
} from '@blog/db/utils/sanity-management-client/sanity-robot-tokens';
import { sanitizeLogMessage } from '@blog/insight';
import { DEPROVISIONING_TOKEN_REVOKE_FAILED_EVENT } from '@worker/constants/deprovisioning';
import { logger } from '@worker/utils/logger/logger';
import { FatalError } from 'workflow';

// Tolerant once the order is known, like the CLI step: a stray unrevoked token is a follow-up cleanup, never a reason to stop the teardown.
export async function revokeTenantSanityTokens(tenant: TTenant): Promise<void> {
  const { id: tenantId, sanityProjectId: projectId } = tenant;
  if (!projectId) return;

  const credentials = await getTenantSanityManagementCredentials(tenantId);
  if (!credentials) {
    logger.error(DEPROVISIONING_TOKEN_REVOKE_FAILED_EVENT, {
      tenantId,
      error: 'no Sanity management token (sanityManagementTokenEncrypted)',
    });
    return;
  }
  const { token, managementRobotId } = credentials;
  if (!managementRobotId) {
    throw new FatalError(missingManagementRobotIdMessage(tenantId));
  }

  try {
    const robots = await listSanityRobotTokens({ token, projectId });
    for (const robot of robotsInRevocationOrder(robots, managementRobotId)) {
      await deleteSanityRobotToken({ token, projectId, robotId: robot.id });
    }
  } catch (error) {
    logger.error(DEPROVISIONING_TOKEN_REVOKE_FAILED_EVENT, {
      tenantId,
      error: sanitizeLogMessage(error),
    });
  }
}
