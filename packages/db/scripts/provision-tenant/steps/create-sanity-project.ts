import { getTenantOwnerEmail } from '@blog/db/queries/memberships';
import { setTenantSanityProject } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';

import type { TProvisionEnv } from '../lib/env';
import {
  addSanityCorsOrigin,
  createSanityDataset,
  createSanityProject,
  createSanityProjectInvite,
  listSanityCorsOrigins,
  listSanityDatasets,
  listSanityProjectInvites,
} from '../lib/sanity-management-client';

export type TCreateSanityProjectResult = {
  sanityProjectId: string;
  sanityDataset: string;
};

// `editor` can author/publish content but can't change project settings or
// manage members — the platform (via `SANITY_MANAGEMENT_TOKEN`) keeps sole
// control over the project itself, not the tenant owner.
const OWNER_INVITE_ROLE = 'editor';

/**
 * Step 1 — creates the tenant's own Sanity project, its dataset (named per
 * `env.tenantSanityDataset`), a CORS entry for the admin app's origin, and
 * invites the tenant owner (resolved from their OWNER `memberships` row) as
 * a project member — Sanity Studio's login flow requires project
 * membership, so without this no one could sign into the deployed Studio.
 *
 * The project id is persisted the moment it's minted, before the dataset/CORS
 * calls: Sanity has no delete-project API to clean up an orphan, so a retry
 * must be able to find a project it already created rather than re-minting one.
 *
 * Does NOT mint a token — see `steps/persist-sanity-token.ts` for why that's
 * step 4's job, not this one.
 */
export async function createTenantSanityProject(
  tenant: TTenant,
  env: TProvisionEnv,
): Promise<TCreateSanityProjectResult> {
  let projectId = tenant.sanityProjectId;

  if (!projectId) {
    const project = await createSanityProject({
      token: env.sanityManagementToken,
      displayName: tenant.name,
      organizationId: env.sanityOrganizationId,
    });
    projectId = project.id;

    await setTenantSanityProject(tenant.id, {
      sanityProjectId: projectId,
      sanityDataset: env.tenantSanityDataset,
    });
  }

  const datasets = await listSanityDatasets({
    token: env.sanityManagementToken,
    projectId,
  });
  if (!datasets.some((dataset) => dataset.name === env.tenantSanityDataset)) {
    await createSanityDataset({
      token: env.sanityManagementToken,
      projectId,
      dataset: env.tenantSanityDataset,
    });
  }

  const corsOrigins = await listSanityCorsOrigins({
    token: env.sanityManagementToken,
    projectId,
  });
  if (!corsOrigins.some((cors) => cors.origin === env.adminAppBaseUrl)) {
    await addSanityCorsOrigin({
      token: env.sanityManagementToken,
      projectId,
      origin: env.adminAppBaseUrl,
      allowCredentials: true,
    });
  }

  const ownerEmail = await getTenantOwnerEmail(tenant.id);
  if (ownerEmail) {
    const invites = await listSanityProjectInvites({
      token: env.sanityManagementToken,
      projectId,
    });
    const alreadyInvited = invites.some(
      (invite) => invite.email?.toLowerCase() === ownerEmail.toLowerCase(),
    );

    if (!alreadyInvited) {
      await createSanityProjectInvite({
        token: env.sanityManagementToken,
        projectId,
        email: ownerEmail,
        role: OWNER_INVITE_ROLE,
      });
    }
  } else {
    // Tenant creation always inserts an OWNER membership, so this should
    // only happen on a genuine data anomaly. Provisioning must still
    // complete — logging is the only trace an operator gets that the
    // tenant's owner has no Sanity Studio invite and needs one by hand.
    console.error(
      `create-sanity-project: no resolvable owner email for tenant "${tenant.id}" — skipping Sanity Studio invite.`,
    );
  }

  return { sanityProjectId: projectId, sanityDataset: env.tenantSanityDataset };
}
