import { getTenantOwnerEmail } from '@blog/db/queries/memberships';
import { setTenantSanityProject } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import { sanitizeLogMessage } from '@blog/insight';

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

// `viewer` is the only project-member role `SANITY_MANAGEMENT_TOKEN` (an
// org-level "create project" token) has permission to grant — attempting
// `administrator` 403s. Do not "correct" this back; an operator upgrades an
// invitee to administrator by hand in the Sanity Manage UI after they accept.
const TENANT_PROJECT_MEMBER_ROLE = 'viewer';

/**
 * Step 1 — creates the tenant's own Sanity project, its dataset (named per
 * `env.tenantSanityDataset`), a CORS entry for the admin app's origin, and
 * invites the tenant owner (resolved from their OWNER `memberships` row) as
 * a project member — Sanity Studio's login flow requires project
 * membership, so without this the owner could never sign into the deployed
 * Studio. The platform superadmin is not invited here: unlike the owner,
 * they're already in the Sanity organization and can add themselves to any
 * tenant project as administrator via the Sanity Manage UI, so a `viewer`
 * invite for them would only cost a Free-plan seat for no benefit.
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

  if (!ownerEmail) {
    // Tenant creation always inserts an OWNER membership, so this should
    // only happen on a genuine data anomaly. Provisioning must still
    // complete — logging is the only trace an operator gets that the
    // tenant's owner has no Sanity Studio invite and needs one by hand.
    console.error(
      `create-sanity-project: no resolvable owner email for tenant "${tenant.id}" — skipping Sanity Studio invite.`,
    );
  } else {
    // Listing invites can fail the same way inviting can (a token permission
    // gap, a transient Access API error). Without it there's no reliable way
    // to tell whether the owner is already invited, so the invite is skipped
    // for this run rather than risking duplicate-invite noise — a later
    // retry re-lists and catches up.
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
      // Sanity Studio's login flow requires project membership, but a
      // failed invite must not block the rest of provisioning (dataset
      // seeding, the read-only token, domain mapping, the webhook) — an
      // operator can always send the invite by hand afterward.
      try {
        await createSanityProjectInvite({
          token: env.sanityManagementToken,
          projectId,
          email: ownerEmail,
          role: TENANT_PROJECT_MEMBER_ROLE,
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
