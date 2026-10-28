import type { TMaybeUndefined } from '@blog/config';
import { env } from '@worker/utils/env/env';
import { requireValues } from '@worker/utils/provision-env/provision-env';

export type TVercelEnv = {
  vercelToken: string;
  vercelTeamId: TMaybeUndefined<string>;
  vercelWebProjectId: string;
};

export function getVercelEnv(): TVercelEnv {
  const required = requireValues({
    VERCEL_TOKEN: env.VERCEL_TOKEN,
    VERCEL_PROJECT_ID_WEB: env.VERCEL_PROJECT_ID_WEB,
  });

  return {
    vercelToken: required.VERCEL_TOKEN,
    vercelTeamId: env.VERCEL_TEAM_ID,
    vercelWebProjectId: required.VERCEL_PROJECT_ID_WEB,
  };
}
