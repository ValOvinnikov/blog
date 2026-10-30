import { type TMaybeUndefined, SANITY_PROJECT_ROLE } from '@blog/config';
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
import { logger } from '@worker/utils/logger/logger';
import type { TProvisionEnv } from '@worker/utils/provision-env/provision-env';
import { ensureTenantManagementToken } from '@worker/utils/tenant-management-token/tenant-management-token';

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

  const token = await ensureTenantManagementToken({
    tenantId: tenant.id,
    projectId,
    organizationToken: env.sanityManagementToken,
  });

  const datasets = await listSanityDatasets({
    token,
    projectId,
  });
  if (!datasets.some((dataset) => dataset.name === env.tenantSanityDataset)) {
    await createSanityDataset({
      token,
      projectId,
      dataset: env.tenantSanityDataset,
    });
  }

  const corsOrigins = await listSanityCorsOrigins({
    token,
    projectId,
  });
  if (!corsOrigins.some((cors) => cors.origin === env.platformAppBaseUrl)) {
    await addSanityCorsOrigin({
      token,
      projectId,
      origin: env.platformAppBaseUrl,
      allowCredentials: true,
    });
  }

  const ownerEmail = await getTenantOwnerEmail(tenant.id);

  if (!ownerEmail) {
    logger.error('provisioning.owner_email_missing', { tenantId: tenant.id });
  } else {
    let alreadyInvited: TMaybeUndefined<boolean>;
    try {
      const invites = await listSanityProjectInvites({
        token,
        projectId,
      });
      alreadyInvited = invites.some(
        (invite) => invite.email?.toLowerCase() === ownerEmail.toLowerCase(),
      );
    } catch (error) {
      logger.error('provisioning.owner_invites_list_failed', {
        tenantId: tenant.id,
        error: sanitizeLogMessage(error),
      });
    }

    if (alreadyInvited === false) {
      try {
        await createSanityProjectInvite({
          token,
          projectId,
          email: ownerEmail,
          // The invites endpoint rejects `administrator` with a 403.
          role: SANITY_PROJECT_ROLE.VIEWER,
        });
      } catch (error) {
        logger.error('provisioning.owner_invite_failed', {
          tenantId: tenant.id,
          sanityProjectId: projectId,
          error: sanitizeLogMessage(error),
        });
      }
    }
  }

  return { sanityProjectId: projectId, sanityDataset: env.tenantSanityDataset };
}
