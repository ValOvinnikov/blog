import { setTenantSanityToken } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';

import type { TProvisionEnv } from '../lib/env';
import { createSanityRobotToken } from '../lib/sanity-management-client';

const READ_TOKEN_LABEL = 'web-read (provisioned)';

export type TPersistSanityTokenDeps = {
  mintReadToken: typeof createSanityRobotToken;
};

const defaultDeps: TPersistSanityTokenDeps = {
  mintReadToken: createSanityRobotToken,
};

/**
 * Step 3 — mints this tenant's long-lived, read-only (`viewer`) Sanity
 * token and persists it encrypted via `setTenantSanityToken` (which handles
 * the AES-256-GCM encryption itself).
 *
 * Minted here, not in step 1 ("Create Sanity project"): step 1 only creates
 * the project/dataset/CORS entry, so a run that crashes between "project
 * created" and "token persisted" resumes cleanly at this step without
 * needing to carry a plaintext token value across a process restart.
 * Idempotency is "has `sanityReadTokenEncrypted` been set", not "was a
 * token minted" — a previously-minted-but-never-persisted token from an
 * earlier interrupted run is simply orphaned and unused, not a security
 * issue that needs cleanup.
 */
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
    label: READ_TOKEN_LABEL,
    role: 'viewer',
  });

  await setTenantSanityToken(tenant.id, readToken.token);
}
