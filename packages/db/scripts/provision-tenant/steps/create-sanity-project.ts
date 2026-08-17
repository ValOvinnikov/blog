import { setTenantSanityProject } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';

import type { TProvisionEnv } from '../lib/env';
import {
  addSanityCorsOrigin,
  createSanityDataset,
  createSanityProject,
} from '../lib/sanity-management-client';

const SANITY_DATASET = 'production';

export type TCreateSanityProjectResult = {
  sanityProjectId: string;
  sanityDataset: string;
};

/**
 * Step 1 — creates the tenant's own Sanity project, its `production`
 * dataset, and a CORS entry for the admin app's origin. Idempotent: skips
 * creation entirely once `tenants.sanityProjectId`/`sanityDataset` are
 * already set, returning the persisted values instead.
 *
 * Does NOT mint a token — see `steps/persist-sanity-token.ts` for why that's
 * step 4's job, not this one.
 */
export async function createTenantSanityProject(
  tenant: TTenant,
  env: TProvisionEnv,
): Promise<TCreateSanityProjectResult> {
  if (tenant.sanityProjectId && tenant.sanityDataset) {
    return {
      sanityProjectId: tenant.sanityProjectId,
      sanityDataset: tenant.sanityDataset,
    };
  }

  const project = await createSanityProject({
    token: env.sanityManagementToken,
    displayName: tenant.name,
    organizationId: env.sanityOrganizationId,
  });

  await createSanityDataset({
    token: env.sanityManagementToken,
    projectId: project.id,
    dataset: SANITY_DATASET,
  });

  await addSanityCorsOrigin({
    token: env.sanityManagementToken,
    projectId: project.id,
    origin: env.adminAppBaseUrl,
    allowCredentials: true,
  });

  await setTenantSanityProject(tenant.id, {
    sanityProjectId: project.id,
    sanityDataset: SANITY_DATASET,
  });

  return { sanityProjectId: project.id, sanityDataset: SANITY_DATASET };
}
