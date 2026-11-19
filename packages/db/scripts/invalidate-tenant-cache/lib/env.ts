import { requireEnv } from '../../lib/require-env';

import { TOOL } from './tool';

export type TInvalidateCacheEnv = {
  webAppUrl: string;
  siteConfigRevalidateSecret: string;
  dryRun: boolean;
};

export function loadInvalidateCacheEnv(dryRun: boolean): TInvalidateCacheEnv {
  return {
    webAppUrl: requireEnv(TOOL, 'WEB_APP_URL'),
    siteConfigRevalidateSecret: requireEnv(
      TOOL,
      'SITE_CONFIG_REVALIDATE_SECRET',
    ),
    dryRun,
  };
}
