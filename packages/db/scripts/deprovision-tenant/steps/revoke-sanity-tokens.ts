import type { TTenant } from '@blog/db/schema/tenants';
import {
  deleteSanityRobotToken,
  listSanityRobotTokens,
} from '@blog/db/utils/sanity-management-client/sanity-robot-tokens';
import { isProvisionedRobotToken } from '@blog/db/utils/sanity-management-client/sanity-token-labels';
import { sanitizeLogMessage } from '@blog/insight';

import type { TDeprovisionEnv } from '../lib/env';

export type TRevokeSanityTokensDeps = {
  listRobotTokens: typeof listSanityRobotTokens;
  revokeToken: typeof deleteSanityRobotToken;
};

const defaultDeps: TRevokeSanityTokensDeps = {
  listRobotTokens: listSanityRobotTokens,
  revokeToken: deleteSanityRobotToken,
};

// Tolerant throughout: a stray unrevoked token is a follow-up cleanup, never a reason to stop the teardown.
export async function revokeTenantSanityTokens(
  tenant: TTenant,
  env: TDeprovisionEnv,
  deps: TRevokeSanityTokensDeps = defaultDeps,
): Promise<void> {
  if (!tenant.sanityProjectId) return;

  if (env.dryRun) {
    console.warn(
      `[dry-run] would revoke provisioned Sanity robot tokens for project "${tenant.sanityProjectId}".`,
    );
    return;
  }

  let robots;
  try {
    robots = await deps.listRobotTokens({
      token: env.sanityManagementToken,
      projectId: tenant.sanityProjectId,
    });
  } catch (error) {
    console.error(
      `deprovision-tenant: failed to list Sanity robot tokens for project "${tenant.sanityProjectId}" (${sanitizeLogMessage(error)}).`,
    );
    return;
  }

  const provisionedRobots = robots.filter(isProvisionedRobotToken);

  for (const robot of provisionedRobots) {
    try {
      await deps.revokeToken({
        token: env.sanityManagementToken,
        projectId: tenant.sanityProjectId,
        robotId: robot.id,
      });
    } catch (error) {
      console.error(
        `deprovision-tenant: failed to revoke Sanity robot token "${robot.id}" (label "${robot.label}") for project "${tenant.sanityProjectId}" (${sanitizeLogMessage(error)}).`,
      );
    }
  }
}
