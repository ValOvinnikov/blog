import { setTenantSanityProject } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';

import type { TProvisionEnv } from '../lib/env';
import {
  addSanityCorsOrigin,
  createSanityDataset,
  createSanityProject,
  listSanityCorsOrigins,
  listSanityDatasets,
} from '../lib/sanity-management-client';

const SANITY_DATASET = 'production';

export type TCreateSanityProjectResult = {
  sanityProjectId: string;
  sanityDataset: string;
};

/**
 * Step 1 — creates the tenant's own Sanity project, its `production`
 * dataset, and a CORS entry for the admin app's origin.
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
      sanityDataset: SANITY_DATASET,
    });
  }

  const datasets = await listSanityDatasets({
    token: env.sanityManagementToken,
    projectId,
  });
  if (!datasets.some((dataset) => dataset.name === SANITY_DATASET)) {
    await createSanityDataset({
      token: env.sanityManagementToken,
      projectId,
      dataset: SANITY_DATASET,
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

  return { sanityProjectId: projectId, sanityDataset: SANITY_DATASET };
}
