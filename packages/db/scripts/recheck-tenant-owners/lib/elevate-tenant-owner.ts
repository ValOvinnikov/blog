import { SANITY_PROJECT_ROLE } from '@blog/config';
import {
  ELEVATE_TENANT_OWNER_OUTCOME,
  type TElevateTenantOwnerOutcome,
} from '@blog/db/constants';
import { getTenantSanityManagementCredentials } from '@blog/db/queries/tenants/get-tenant-sanity-management-credentials';
import type { TTenant } from '@blog/db/schema/tenants';
import {
  grantSanityProjectRole,
  listSanityProjectAcl,
} from '@blog/db/utils/sanity-management-client/sanity-project-access';
import { sanityRoleChangeToken } from '@blog/db/utils/sanity-management-client/sanity-role-change-token';
import { sanitizeLogMessage } from '@blog/insight';

import type { TRecheckEnv } from './env';

// Long enough not to flag a same-day signup, short enough to surface a quiet non-acceptance promptly.
const OWNER_ACCEPTANCE_STALL_THRESHOLD_MS = 1000 * 60 * 60 * 24 * 3;

async function requireProjectToken(tenantId: string): Promise<string> {
  const credentials = await getTenantSanityManagementCredentials(tenantId);
  if (!credentials) {
    throw new Error(
      `tenant "${tenantId}" has no Sanity management token (sanityManagementTokenEncrypted) — re-provision it to mint one.`,
    );
  }
  return credentials.token;
}

async function grantOwnerAdministrator(input: {
  env: TRecheckEnv;
  projectId: string;
  projectToken: string;
  projectUserId: string;
}): Promise<void> {
  const { env, projectId, projectToken, projectUserId } = input;
  try {
    await grantSanityProjectRole({
      token: sanityRoleChangeToken({
        roleName: SANITY_PROJECT_ROLE.ADMINISTRATOR,
        organizationToken: env.sanityManagementToken,
        projectToken,
      }),
      projectId,
      projectUserId,
      role: SANITY_PROJECT_ROLE.ADMINISTRATOR,
    });
  } catch (error) {
    throw new Error(
      `SANITY_MANAGEMENT_TOKEN could not make the owner administrator of Sanity project "${projectId}" (${sanitizeLogMessage(error)}). If the token was rotated after this project was created, it can no longer grant administrator there: make the owner Administrator by hand in Sanity Manage, under the project's Members.`,
      { cause: error },
    );
  }
}

// A pending invitee never appears in the ACL listing, so its absence is a time-bound PENDING_ACCEPTANCE or STALLED outcome, never an error.
export async function elevateTenantOwner(
  tenant: TTenant,
  env: TRecheckEnv,
): Promise<TElevateTenantOwnerOutcome> {
  const { id: tenantId, sanityProjectId, createdAt } = tenant;
  if (!sanityProjectId) {
    return ELEVATE_TENANT_OWNER_OUTCOME.PENDING_ACCEPTANCE;
  }

  const projectToken = await requireProjectToken(tenantId);
  const acl = await listSanityProjectAcl({
    token: projectToken,
    projectId: sanityProjectId,
  });

  const humanEntries = acl.filter((entry) => !entry.isRobot);

  if (humanEntries.length > 1) {
    return ELEVATE_TENANT_OWNER_OUTCOME.AMBIGUOUS_MEMBERSHIP;
  }

  const [ownerEntry] = humanEntries;

  if (!ownerEntry) {
    const elapsedMs = Date.now() - createdAt.getTime();
    return elapsedMs >= OWNER_ACCEPTANCE_STALL_THRESHOLD_MS
      ? ELEVATE_TENANT_OWNER_OUTCOME.STALLED
      : ELEVATE_TENANT_OWNER_OUTCOME.PENDING_ACCEPTANCE;
  }

  const isAlreadyAdministrator = ownerEntry.roles.some(
    (role) => role.name === SANITY_PROJECT_ROLE.ADMINISTRATOR,
  );
  if (isAlreadyAdministrator) {
    return ELEVATE_TENANT_OWNER_OUTCOME.ALREADY_ADMINISTRATOR;
  }

  await grantOwnerAdministrator({
    env,
    projectId: sanityProjectId,
    projectToken,
    projectUserId: ownerEntry.projectUserId,
  });

  return ELEVATE_TENANT_OWNER_OUTCOME.ELEVATED;
}
