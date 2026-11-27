import type { TMaybeUndefined } from '@shinefold/config/types';
import { getTenantSanityManagementCredentials } from '@shinefold/db/queries/tenants/get-tenant-sanity-management-credentials';
import type { TTenant } from '@shinefold/db/schema/tenants';
import {
  missingManagementRobotIdMessage,
  revokeSanityRobotToken,
  robotsInRevocationOrder,
} from '@shinefold/db/utils/sanity-management-client/sanity-robot-revocation';
import {
  getSanityTokenUserId,
  listSanityRobotTokens,
  type TSanityRobotTokenSummary,
} from '@shinefold/db/utils/sanity-management-client/sanity-robot-tokens';
import { sanitizeLogMessage } from '@shinefold/insight';

import type { TDeprovisionEnv } from '../lib/env';

export type TRevokeSanityTokensDeps = {
  getManagementCredentials: typeof getTenantSanityManagementCredentials;
  listRobotTokens: typeof listSanityRobotTokens;
  getTokenUserId: typeof getSanityTokenUserId;
  revokeToken: typeof revokeSanityRobotToken;
};

const defaultDeps: TRevokeSanityTokensDeps = {
  getManagementCredentials: getTenantSanityManagementCredentials,
  listRobotTokens: listSanityRobotTokens,
  getTokenUserId: getSanityTokenUserId,
  revokeToken: revokeSanityRobotToken,
};

async function listRevocableRobots(
  token: string,
  projectId: string,
  env: TDeprovisionEnv,
  deps: TRevokeSanityTokensDeps,
  managementRobotId: string,
): Promise<TMaybeUndefined<TSanityRobotTokenSummary[]>> {
  try {
    const [robots, organizationRobotId] = await Promise.all([
      deps.listRobotTokens({ token, projectId }),
      deps.getTokenUserId(env.sanityManagementToken),
    ]);
    return robotsInRevocationOrder(robots, {
      managementRobotId,
      organizationRobotId,
    });
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

  const robots = await listRevocableRobots(
    token,
    projectId,
    env,
    deps,
    managementRobotId,
  );
  if (!robots) return;

  for (const robot of robots) {
    try {
      await deps.revokeToken({
        token,
        organizationToken: env.sanityManagementToken,
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
