import type { TTenant } from '@blog/db/schema/tenants';
import {
  deleteSanityRobotToken,
  listSanityRobotTokens,
} from '@blog/db/utils/sanity-management-client/sanity-management-client';
import {
  SANITY_READ_TOKEN_LABEL,
  SANITY_WRITE_TOKEN_LABEL,
} from '@blog/db/utils/sanity-management-client/sanity-token-labels';
import { sanitizeLogMessage } from '@blog/insight';

import type { TDeprovisionEnv } from '../lib/env';

const PROVISIONED_TOKEN_LABELS: string[] = [
  SANITY_READ_TOKEN_LABEL,
  SANITY_WRITE_TOKEN_LABEL,
];

export type TRevokeSanityTokensDeps = {
  listRobotTokens: typeof listSanityRobotTokens;
  revokeToken: typeof deleteSanityRobotToken;
};

const defaultDeps: TRevokeSanityTokensDeps = {
  listRobotTokens: listSanityRobotTokens,
  revokeToken: deleteSanityRobotToken,
};

/**
 * Step 3 — revokes the provisioned read/write Sanity robot tokens still
 * live in the tenant's project, recovering their robot ids by listing the
 * project's robots and matching on label rather than reading anything
 * persisted on the `tenants` row. Must run before `clear-artifacts`, which
 * nulls the encrypted token columns this step would otherwise have no
 * other way to cross-reference. Tolerant of failure throughout: a listing
 * or deletion error is logged and swallowed rather than stopping the rest
 * of the deprovisioning run, since a stray unrevoked token is a follow-up
 * cleanup, not a reason to abandon tearing the rest of the tenant down.
 */
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

  const provisionedRobots = robots.filter(
    (robot) =>
      robot.label !== undefined &&
      PROVISIONED_TOKEN_LABELS.includes(robot.label),
  );

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
