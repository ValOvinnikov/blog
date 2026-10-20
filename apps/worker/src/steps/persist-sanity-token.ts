import { SANITY_ROBOT_ROLE } from '@blog/config';
import { setTenantSanityToken } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import { createSanityRobotToken } from '@blog/db/utils/sanity-management-client/sanity-robot-tokens';
import { SANITY_READ_TOKEN_LABEL } from '@blog/db/utils/sanity-management-client/sanity-token-labels';
import type { TProvisionEnv } from '@worker/utils/provision-env/provision-env';

export type TPersistSanityTokenDeps = {
  mintReadToken: typeof createSanityRobotToken;
};

const defaultDeps: TPersistSanityTokenDeps = {
  mintReadToken: createSanityRobotToken,
};

// Idempotent on `sanityReadTokenEncrypted`, so a token minted by an interrupted run is orphaned, never reused.
export async function persistTenantSanityToken(
  tenant: TTenant,
  env: TProvisionEnv,
  deps: TPersistSanityTokenDeps = defaultDeps,
): Promise<void> {
  if (tenant.sanityReadTokenEncrypted) return;

  if (!tenant.sanityProjectId) {
    throw new Error(
      `persistTenantSanityToken: tenant "${tenant.id}" has no Sanity project yet — run the "Create Sanity project" step first.`,
    );
  }

  const readToken = await deps.mintReadToken({
    token: env.sanityManagementToken,
    projectId: tenant.sanityProjectId,
    label: SANITY_READ_TOKEN_LABEL,
    role: SANITY_ROBOT_ROLE.VIEWER,
  });

  await setTenantSanityToken(tenant.id, readToken.token);
}
