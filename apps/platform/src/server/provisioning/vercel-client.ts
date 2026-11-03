import type { TMaybeUndefined } from '@blog/config';
import { env } from '@platform/utils/env/env';

export type TVercelCredentials = {
  token: string;
  projectId: string;
  teamId: TMaybeUndefined<string>;
};

const VERCEL_API_ORIGIN = 'https://api.vercel.com';

const VERCEL_TIMEOUT_MS = 5000;

export const readVercelCredentials =
  (): TMaybeUndefined<TVercelCredentials> => {
    const {
      VERCEL_API_TOKEN: token,
      VERCEL_PROJECT_ID_WEB: projectId,
      VERCEL_TEAM_ID: teamId,
    } = env;

    return token && projectId ? { token, projectId, teamId } : undefined;
  };

export const fetchVercel = (
  { token, teamId }: TVercelCredentials,
  path: string,
  searchParams: Record<string, string> = {},
): Promise<Response> => {
  const url = new URL(path, VERCEL_API_ORIGIN);
  if (teamId) url.searchParams.set('teamId', teamId);
  for (const [name, value] of Object.entries(searchParams)) {
    url.searchParams.set(name, value);
  }

  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(VERCEL_TIMEOUT_MS),
  });
};
