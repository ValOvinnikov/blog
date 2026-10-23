import type { TMaybeUndefined } from '@blog/config';
import { env } from '@worker/utils/env/env';
import { FatalError } from 'workflow';

export type TProvisionEnv = {
  sanityManagementToken: string;
  sanityOrganizationId: string;
  vercelToken: string;
  vercelTeamId: TMaybeUndefined<string>;
  vercelWebProjectId: string;
  platformAppBaseUrl: string;
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

export function requireValues<TName extends string>(
  values: Record<TName, TMaybeUndefined<string>>,
): Record<TName, string> {
  const names = Object.keys(values) as TName[];
  return Object.fromEntries(
    names.map((name) => [name, requireValue(name, values[name])]),
  ) as Record<TName, string>;
}

export function getProvisionEnv(): TProvisionEnv {
  const required = requireValues({
    SANITY_MANAGEMENT_TOKEN: env.SANITY_MANAGEMENT_TOKEN,
    SANITY_ORGANIZATION_ID: env.SANITY_ORGANIZATION_ID,
    VERCEL_TOKEN: env.VERCEL_TOKEN,
    VERCEL_PROJECT_ID_WEB: env.VERCEL_PROJECT_ID_WEB,
    PLATFORM_APP_BASE_URL: env.PLATFORM_APP_BASE_URL,
    TENANT_SANITY_DATASET: env.TENANT_SANITY_DATASET,
    WEB_APP_URL: env.WEB_APP_URL,
    SANITY_REVALIDATE_SECRET: env.SANITY_REVALIDATE_SECRET,
  });

  return {
    sanityManagementToken: required.SANITY_MANAGEMENT_TOKEN,
    sanityOrganizationId: required.SANITY_ORGANIZATION_ID,
    vercelToken: required.VERCEL_TOKEN,
    vercelTeamId: env.VERCEL_TEAM_ID,
    vercelWebProjectId: required.VERCEL_PROJECT_ID_WEB,
    platformAppBaseUrl: required.PLATFORM_APP_BASE_URL,
    tenantSanityDataset: required.TENANT_SANITY_DATASET,
    webAppBaseUrl: required.WEB_APP_URL,
    revalidateSecret: required.SANITY_REVALIDATE_SECRET,
  };
}
