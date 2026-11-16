import { SANITY_ROBOT_ROLE } from '@shinefold/config';
import { setTenantSanityToken } from '@shinefold/db/queries/tenants';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { createSanityRobotToken } from '@shinefold/db/utils/sanity-management-client/sanity-robot-tokens';
import { buildSanityTokenLabels } from '@shinefold/db/utils/sanity-management-client/sanity-token-labels';
import { requireTenantManagementToken } from '@worker/utils/tenant-management-token/tenant-management-token';

export type TPersistSanityTokenDeps = {
  mintReadToken: typeof createSanityRobotToken;
};

const defaultDeps: TPersistSanityTokenDeps = {
  mintReadToken: createSanityRobotToken,
};

// Idempotent on `sanityReadTokenEncrypted`, so a token minted by an interrupted run is orphaned, never reused.
export async function persistTenantSanityToken(
  tenant: TTenant,
  productName: string,
  deps: TPersistSanityTokenDeps = defaultDeps,
): Promise<void> {
  if (tenant.sanityReadTokenEncrypted) return;

  if (!tenant.sanityProjectId) {
    throw new Error(
      `persistTenantSanityToken: tenant "${tenant.id}" has no Sanity project yet — run the "Create Sanity project" step first.`,
    );
  }

  const readToken = await deps.mintReadToken({
    token: await requireTenantManagementToken(tenant.id),
    projectId: tenant.sanityProjectId,
    label: buildSanityTokenLabels(productName).read,
    role: SANITY_ROBOT_ROLE.VIEWER,
  });

  await setTenantSanityToken(tenant.id, readToken.token);
}
