import { SANITY_ROBOT_ROLE } from '@blog/config';
import {
  getTenantSanityManagementCredentials,
  setTenantSanityManagementToken,
} from '@blog/db/queries/tenants';
import { createSanityRobotToken } from '@blog/db/utils/sanity-management-client/sanity-robot-tokens';
import { SANITY_MANAGEMENT_TOKEN_LABEL } from '@blog/db/utils/sanity-management-client/sanity-token-labels';
import { FatalError } from 'workflow';

export async function requireTenantManagementToken(
  tenantId: string,
): Promise<string> {
  const credentials = await getTenantSanityManagementCredentials(tenantId);
  if (!credentials) {
    throw new FatalError(
      `Tenant "${tenantId}" has no Sanity management token (sanityManagementTokenEncrypted) — re-provision it to mint one.`,
    );
  }
  return credentials.token;
}

// Minted with the organisation token, which only works while it is the token that created the project.
export async function ensureTenantManagementToken(input: {
  tenantId: string;
  projectId: string;
  organizationToken: string;
}): Promise<string> {
  const { tenantId, projectId, organizationToken } = input;
  const existing = await getTenantSanityManagementCredentials(tenantId);
  if (existing) return existing.token;

  const minted = await createSanityRobotToken({
    token: organizationToken,
    projectId,
    label: SANITY_MANAGEMENT_TOKEN_LABEL,
    role: SANITY_ROBOT_ROLE.DEVELOPER,
  });
  await setTenantSanityManagementToken(tenantId, minted.token);
  return minted.token;
}
