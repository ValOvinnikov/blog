import { SANITY_PROJECT_ROLE } from '@blog/config';
import { getTenantOwnerEmail } from '@blog/db/queries/memberships';
import { setTenantSanityProject } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import {
  createSanityProjectInvite,
  listSanityProjectInvites,
} from '@blog/db/utils/sanity-management-client/sanity-project-access';
import {
  addSanityCorsOrigin,
  createSanityDataset,
  createSanityProject,
  listSanityCorsOrigins,
  listSanityDatasets,
} from '@blog/db/utils/sanity-management-client/sanity-project-setup';
import { sanitizeLogMessage } from '@blog/insight';

import type { TProvisionEnv } from '../lib/env';

export type TCreateSanityProjectResult = {
  sanityProjectId: string;
  sanityDataset: string;
};

/** Sanity has no delete-project API, so the project id is persisted the moment it is minted. */
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

  if (!ownerEmail) {
    console.error(
      `create-sanity-project: no resolvable owner email for tenant "${tenant.id}" — skipping Sanity Studio invite.`,
    );
  } else {
    let alreadyInvited: boolean | undefined;
    try {
      const invites = await listSanityProjectInvites({
        token: env.sanityManagementToken,
        projectId,
      });
      alreadyInvited = invites.some(
        (invite) => invite.email?.toLowerCase() === ownerEmail.toLowerCase(),
      );
    } catch (error) {
      console.error(
        `create-sanity-project: failed to list existing Sanity project invites for tenant "${tenant.id}" — skipping the owner's Sanity Studio invite this run: ${sanitizeLogMessage(error)}`,
      );
    }

    if (alreadyInvited === false) {
      try {
        await createSanityProjectInvite({
          token: env.sanityManagementToken,
          projectId,
          email: ownerEmail,
          // The invites endpoint rejects `administrator` with a 403.
          role: SANITY_PROJECT_ROLE.VIEWER,
        });
      } catch (error) {
        console.error(
          `create-sanity-project: failed to invite the owner to tenant "${tenant.id}"'s Sanity project "${projectId}" — needs a manual invite: ${sanitizeLogMessage(error)}`,
        );
      }
    }
  }

  return { sanityProjectId: projectId, sanityDataset: env.tenantSanityDataset };
}
