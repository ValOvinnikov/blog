import type { TMaybeUndefined } from '@shinefold/config/types';
import { getTenantSanityManagementCredentials } from '@shinefold/db/queries/tenants/get-tenant-sanity-management-credentials';
import type { TTenant } from '@shinefold/db/schema/tenants';
import {
  missingManagementRobotIdMessage,
  revokeSanityRobotToken,
  robotsInRevocationOrder,
} from '@shinefold/db/utils/sanity-management-client/sanity-robot-revocation';
import {
  listSanityRobotTokens,
  type TSanityRobotTokenSummary,
} from '@shinefold/db/utils/sanity-management-client/sanity-robot-tokens';
import { sanitizeLogMessage } from '@shinefold/insight';

import type { TDeprovisionEnv } from '../lib/env';

export type TRevokeSanityTokensDeps = {
  getManagementCredentials: typeof getTenantSanityManagementCredentials;
  listRobotTokens: typeof listSanityRobotTokens;
  revokeToken: typeof revokeSanityRobotToken;
};

const defaultDeps: TRevokeSanityTokensDeps = {
  getManagementCredentials: getTenantSanityManagementCredentials,
  listRobotTokens: listSanityRobotTokens,
  revokeToken: revokeSanityRobotToken,
};

async function listProjectRobots(
  token: string,
  projectId: string,
  deps: TRevokeSanityTokensDeps,
): Promise<TMaybeUndefined<TSanityRobotTokenSummary[]>> {
  try {
    return await deps.listRobotTokens({ token, projectId });
  } catch (error) {
    console.error(
      `deprovision-tenant: failed to list Sanity robot tokens for project "${projectId}" (${sanitizeLogMessage(error)}).`,
    );
    return undefined;
  }
}

// Tolerant once the order is known: a stray unrevoked token is a follow-up cleanup, never a reason to stop the teardown.
export async function revokeTenantSanityTokens(
  tenant: TTenant,
  env: TDeprovisionEnv,
  deps: TRevokeSanityTokensDeps = defaultDeps,
): Promise<void> {
  const { id: tenantId, sanityProjectId: projectId } = tenant;
  if (!projectId) return;

  if (env.dryRun) {
    console.warn(
      `[dry-run] would revoke every Sanity robot token on project "${projectId}".`,
    );
    return;
  }

  const credentials = await deps.getManagementCredentials(tenantId);
  if (!credentials) {
    console.error(
      `deprovision-tenant: tenant "${tenantId}" has no Sanity management token (sanityManagementTokenEncrypted), so it holds no robot tokens of ours on project "${projectId}" — nothing to revoke.`,
    );
    return;
  }
  const { token, managementRobotId } = credentials;
  if (!managementRobotId) {
    throw new Error(missingManagementRobotIdMessage(tenantId));
  }

  const robots = await listProjectRobots(token, projectId, deps);
  if (!robots) return;

  for (const robot of robotsInRevocationOrder(robots, managementRobotId)) {
    try {
      await deps.revokeToken({
        token,
        organisationToken: env.sanityManagementToken,
        projectId,
        robotId: robot.id,
      });
    } catch (error) {
      console.error(
        `deprovision-tenant: failed to revoke Sanity robot token "${robot.id}" (label "${robot.label}") for project "${projectId}" (${sanitizeLogMessage(error)}).`,
      );
    }
  }
}
