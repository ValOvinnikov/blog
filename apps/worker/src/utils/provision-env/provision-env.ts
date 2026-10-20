import type { TMaybeUndefined } from '@blog/config';
import { env } from '@worker/utils/env/env';
import { FatalError } from 'workflow';

export type TProvisionEnv = {
  sanityManagementToken: string;
  sanityOrganizationId: string;
  vercelToken: string;
  vercelTeamId: TMaybeUndefined<string>;
  vercelWebProjectId: string;
  adminAppBaseUrl: string;
  tenantSanityDataset: string;
  webAppBaseUrl: string;
  revalidateSecret: string;
};

function requireValue(name: string, value: TMaybeUndefined<string>): string {
  if (!value) {
    throw new FatalError(`worker: missing required env var ${name}.`);
  }
  return value;
}

export function getProvisionEnv(): TProvisionEnv {
  return {
    sanityManagementToken: requireValue(
      'SANITY_MANAGEMENT_TOKEN',
      env.SANITY_MANAGEMENT_TOKEN,
    ),
    sanityOrganizationId: requireValue(
      'SANITY_ORGANIZATION_ID',
      env.SANITY_ORGANIZATION_ID,
    ),
    vercelToken: requireValue('VERCEL_TOKEN', env.VERCEL_TOKEN),
    vercelTeamId: env.VERCEL_TEAM_ID,
    vercelWebProjectId: requireValue(
      'VERCEL_PROJECT_ID_WEB',
      env.VERCEL_PROJECT_ID_WEB,
    ),
    adminAppBaseUrl: requireValue('ADMIN_APP_BASE_URL', env.ADMIN_APP_BASE_URL),
    tenantSanityDataset: requireValue(
      'TENANT_SANITY_DATASET',
      env.TENANT_SANITY_DATASET,
    ),
    webAppBaseUrl: requireValue('WEB_APP_URL', env.WEB_APP_URL),
    revalidateSecret: requireValue(
      'SANITY_REVALIDATE_SECRET',
      env.SANITY_REVALIDATE_SECRET,
    ),
  };
}
