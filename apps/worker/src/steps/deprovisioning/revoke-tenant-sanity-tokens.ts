import { getTenantSanityManagementCredentials } from '@shinefold/db/queries/tenants';
import type { TTenant } from '@shinefold/db/schema/tenants';
import {
  missingManagementRobotIdMessage,
  revokeSanityRobotToken,
  robotsInRevocationOrder,
} from '@shinefold/db/utils/sanity-management-client/sanity-robot-revocation';
import { listSanityRobotTokens } from '@shinefold/db/utils/sanity-management-client/sanity-robot-tokens';
import { sanitizeLogMessage } from '@shinefold/insight';
import { DEPROVISIONING_LOG } from '@worker/constants/deprovisioning';
import type { TDeprovisionEnv } from '@worker/utils/deprovision-env/deprovision-env';
import { logger } from '@worker/utils/logger/logger';
import { FatalError } from 'workflow';

// Tolerant once the order is known, like the CLI step: a stray unrevoked token is a follow-up cleanup, never a reason to stop the teardown.
export async function revokeTenantSanityTokens(
  tenant: TTenant,
  env: TDeprovisionEnv,
): Promise<void> {
  const { id: tenantId, sanityProjectId: projectId } = tenant;
  if (!projectId) return;

  const credentials = await getTenantSanityManagementCredentials(tenantId);
  if (!credentials) {
    logger.error(DEPROVISIONING_LOG.TOKEN_REVOKE_FAILED, {
      tenantId,
      error: 'no Sanity management token (sanityManagementTokenEncrypted)',
    });
    return;
  }
  const { token, managementRobotId } = credentials;
  if (!managementRobotId) {
    throw new FatalError(missingManagementRobotIdMessage(tenantId));
  }

  let robots;
  try {
    robots = await listSanityRobotTokens({ token, projectId });
  } catch (error) {
    logger.error(DEPROVISIONING_LOG.TOKEN_REVOKE_FAILED, {
      tenantId,
      error: sanitizeLogMessage(error),
    });
    return;
  }

  for (const { id: robotId } of robotsInRevocationOrder(
    robots,
    managementRobotId,
  )) {
    try {
      await revokeSanityRobotToken({
        token,
        organisationToken: env.sanityManagementToken,
        projectId,
        robotId,
      });
    } catch (error) {
      logger.error(DEPROVISIONING_LOG.TOKEN_REVOKE_FAILED, {
        tenantId,
        robotId,
        error: sanitizeLogMessage(error),
      });
    }
  }
}
