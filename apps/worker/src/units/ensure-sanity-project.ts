import { reactivateTenant } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import { unarchiveSanityProject } from '@blog/db/utils/sanity-management-client/sanity-project-lifecycle';
import { createTenantSanityProject } from '@worker/steps/create-sanity-project';
import type { TProvisionEnv } from '@worker/utils/provision-env/provision-env';
import { FatalError } from 'workflow';

export async function ensureSanityProject(
  tenantId: string,
  env: TProvisionEnv,
): Promise<TTenant> {
  const reactivated = await reactivateTenant(tenantId);
  if (!reactivated.ok) {
    throw new FatalError(
      `Tenant "${tenantId}" could not be reactivated (${reactivated.error}).`,
    );
  }

  const { data: tenant } = reactivated;
  if (tenant.sanityProjectId) {
    await unarchiveSanityProject({
      token: env.sanityManagementToken,
      projectId: tenant.sanityProjectId,
    });
  }

  const project = await createTenantSanityProject(tenant, env);
  return { ...tenant, ...project };
}
