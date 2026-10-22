import type { TTenant } from '@blog/db/schema/tenants';
import { archiveSanityProject } from '@blog/db/utils/sanity-management-client/sanity-project-lifecycle';
import type { TDeprovisionEnv } from '@worker/utils/deprovision-env/deprovision-env';

export async function archiveTenantSanityProject(
  tenant: TTenant,
  env: TDeprovisionEnv,
): Promise<void> {
  const { sanityProjectId } = tenant;
  if (!sanityProjectId) return;

  await archiveSanityProject({
    token: env.sanityManagementToken,
    projectId: sanityProjectId,
  });
}
