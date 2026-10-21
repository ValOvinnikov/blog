import { HTTP_METHOD, type TMaybeUndefined } from '@blog/config';
import {
  VERCEL_API_BASE,
  VERCEL_API_TIMEOUT_MS,
  withTeamId,
} from '@blog/db/utils/vercel-client/vercel-project-domains';

async function vercelRequest<T>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${VERCEL_API_BASE}${path}`, {
    ...init,
    signal: AbortSignal.timeout(VERCEL_API_TIMEOUT_MS),
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `Vercel API ${init.method ?? HTTP_METHOD.GET} ${path} failed: ${response.status} ${body}`,
    );
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export type TVercelDomain = { name: string };

export async function listVercelProjectDomains(input: {
  token: string;
  teamId: TMaybeUndefined<string>;
  projectId: string;
}): Promise<TVercelDomain[]> {
  const result = await vercelRequest<{ domains: TVercelDomain[] }>(
    withTeamId(`/v9/projects/${input.projectId}/domains`, input.teamId),
    input.token,
  );
  return result.domains;
}

export async function addVercelProjectDomain(input: {
  token: string;
  teamId: TMaybeUndefined<string>;
  projectId: string;
  domain: string;
}): Promise<TVercelDomain> {
  return vercelRequest<TVercelDomain>(
    withTeamId(`/v10/projects/${input.projectId}/domains`, input.teamId),
    input.token,
    { method: HTTP_METHOD.POST, body: JSON.stringify({ name: input.domain }) },
  );
}
