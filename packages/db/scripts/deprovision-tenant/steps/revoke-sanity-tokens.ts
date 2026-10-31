import type { TMaybeUndefined } from '@blog/config/types';
import { getTenantSanityManagementCredentials } from '@blog/db/queries/tenants/get-tenant-sanity-management-credentials';
import type { TTenant } from '@blog/db/schema/tenants';
import {
  deleteSanityRobotToken,
  listSanityRobotTokens,
  type TSanityRobotTokenSummary,
} from '@blog/db/utils/sanity-management-client/sanity-robot-tokens';
import { provisionedTokensInRevocationOrder } from '@blog/db/utils/sanity-management-client/sanity-token-labels';
import { sanitizeLogMessage } from '@blog/insight';

import type { TDeprovisionEnv } from '../lib/env';

export type TRevokeSanityTokensDeps = {
  getManagementCredentials: typeof getTenantSanityManagementCredentials;
  listRobotTokens: typeof listSanityRobotTokens;
  revokeToken: typeof deleteSanityRobotToken;
};

const defaultDeps: TRevokeSanityTokensDeps = {
  getManagementCredentials: getTenantSanityManagementCredentials,
  listRobotTokens: listSanityRobotTokens,
  revokeToken: deleteSanityRobotToken,
};

async function listProjectRobots(
  tenantId: string,
  projectId: string,
  deps: TRevokeSanityTokensDeps,
): Promise<
  TMaybeUndefined<{ token: string; robots: TSanityRobotTokenSummary[] }>
> {
  try {
    const credentials = await deps.getManagementCredentials(tenantId);
    if (!credentials) {
      console.error(
        `deprovision-tenant: tenant "${tenantId}" has no Sanity management token (sanityManagementTokenEncrypted), so the provisioned robot tokens on project "${projectId}" were not revoked — revoke them in Sanity Manage.`,
      );
      return undefined;
    }
    const { token } = credentials;
    const robots = await deps.listRobotTokens({ token, projectId });
    return { token, robots };
  } catch (error) {
    console.error(
      `deprovision-tenant: failed to list Sanity robot tokens for project "${projectId}" (${sanitizeLogMessage(error)}).`,
    );
    return undefined;
  }
}

// Tolerant throughout: a stray unrevoked token is a follow-up cleanup, never a reason to stop the teardown.
export async function revokeTenantSanityTokens(
  tenant: TTenant,
  env: TDeprovisionEnv,
  deps: TRevokeSanityTokensDeps = defaultDeps,
): Promise<void> {
  const { id: tenantId, sanityProjectId: projectId } = tenant;
  if (!projectId) return;

  if (env.dryRun) {
    console.warn(
      `[dry-run] would revoke provisioned Sanity robot tokens for project "${projectId}".`,
    );
    return;
  }

  const listed = await listProjectRobots(tenantId, projectId, deps);
  if (!listed) return;
  const { token, robots } = listed;

  for (const robot of provisionedTokensInRevocationOrder(robots)) {
    try {
      await deps.revokeToken({ token, projectId, robotId: robot.id });
    } catch (error) {
      console.error(
        `deprovision-tenant: failed to revoke Sanity robot token "${robot.id}" (label "${robot.label}") for project "${projectId}" (${sanitizeLogMessage(error)}).`,
      );
    }
  }
}
