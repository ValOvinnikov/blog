import type { TMaybeUndefined } from '@shinefold/config/types';

import { requireEnv } from '../../lib/require-env';

import { TOOL } from './tool';

function readMarketingHost(): TMaybeUndefined<string> {
  const value = process.env['MARKETING_SITE_URL'];
  if (!value) {
    return undefined;
  }
  if (!URL.canParse(value)) {
    throw new Error(`${TOOL}: MARKETING_SITE_URL is not a valid URL.`);
  }
  return new URL(value).hostname;
}

export type TDeprovisionEnv = {
  sanityManagementToken: string;
  vercelToken: string;
  vercelTeamId: TMaybeUndefined<string>;
  vercelWebProjectId: string;
  tenantRootDomain: string;
  marketingHost: TMaybeUndefined<string>;
  dryRun: boolean;
  githubActor: TMaybeUndefined<string>;
  githubRunId: TMaybeUndefined<string>;
  githubRepository: TMaybeUndefined<string>;
  githubServerUrl: TMaybeUndefined<string>;
  webAppUrl: TMaybeUndefined<string>;
  siteConfigRevalidateSecret: TMaybeUndefined<string>;
};

export function loadDeprovisionEnv(dryRun: boolean): TDeprovisionEnv {
  return {
    sanityManagementToken: requireEnv(TOOL, 'SANITY_MANAGEMENT_TOKEN'),
    vercelToken: requireEnv(TOOL, 'VERCEL_TOKEN'),
    vercelTeamId: process.env['VERCEL_TEAM_ID'],
    vercelWebProjectId: requireEnv(TOOL, 'VERCEL_PROJECT_ID_WEB'),
    tenantRootDomain: requireEnv(TOOL, 'TENANT_ROOT_DOMAIN'),
    marketingHost: readMarketingHost(),
    dryRun,
    githubActor: process.env['GITHUB_ACTOR'],
    githubRunId: process.env['GITHUB_RUN_ID'],
    githubRepository: process.env['GITHUB_REPOSITORY'],
    githubServerUrl: process.env['GITHUB_SERVER_URL'],
    webAppUrl: process.env['WEB_APP_URL'],
    siteConfigRevalidateSecret: process.env['SITE_CONFIG_REVALIDATE_SECRET'],
  };
}
