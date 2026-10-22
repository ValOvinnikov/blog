import type { TTenant } from '@blog/db/schema/tenants';
import {
  deleteSanityRobotToken,
  listSanityRobotTokens,
} from '@blog/db/utils/sanity-management-client/sanity-robot-tokens';
import { isProvisionedRobotToken } from '@blog/db/utils/sanity-management-client/sanity-token-labels';
import { sanitizeLogMessage } from '@blog/insight';
import { DEPROVISIONING_TOKEN_REVOKE_FAILED_EVENT } from '@worker/constants/deprovisioning';
import type { TDeprovisionEnv } from '@worker/utils/deprovision-env/deprovision-env';
import { logger } from '@worker/utils/logger/logger';

// Tolerant like the CLI step: a stray unrevoked token is a follow-up cleanup, never a reason to stop the teardown.
export async function revokeTenantSanityTokens(
  tenant: TTenant,
  env: TDeprovisionEnv,
): Promise<void> {
  const { id: tenantId, sanityProjectId: projectId } = tenant;
  if (!projectId) return;
  const token = env.sanityManagementToken;

  try {
    const robots = await listSanityRobotTokens({ token, projectId });
    for (const robot of robots.filter(isProvisionedRobotToken)) {
      await deleteSanityRobotToken({ token, projectId, robotId: robot.id });
    }
  } catch (error) {
    logger.error(DEPROVISIONING_TOKEN_REVOKE_FAILED_EVENT, {
      tenantId,
      error: sanitizeLogMessage(error),
    });
  }
}
