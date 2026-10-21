import { HTTP_METHOD, HTTP_STATUS, type TMaybeUndefined } from '@blog/config';

const QUERY_START = '?';

export const VERCEL_API_BASE = 'https://api.vercel.com';
export const VERCEL_API_TIMEOUT_MS = 30_000;

export function withTeamId(
  path: string,
  teamId: TMaybeUndefined<string>,
): string {
  if (!teamId) return path;
  const separator = path.includes(QUERY_START) ? '&' : QUERY_START;
  return `${path}${separator}teamId=${encodeURIComponent(teamId)}`;
}

export type TVercelDeleteResult = { alreadyGone: boolean };

export async function deleteVercelProjectDomain(input: {
  token: string;
  teamId: TMaybeUndefined<string>;
  projectId: string;
  domain: string;
}): Promise<TVercelDeleteResult> {
  const path = withTeamId(
    `/v9/projects/${input.projectId}/domains/${input.domain}`,
    input.teamId,
  );
  const response = await fetch(`${VERCEL_API_BASE}${path}`, {
    method: HTTP_METHOD.DELETE,
    headers: { Authorization: `Bearer ${input.token}` },
    signal: AbortSignal.timeout(VERCEL_API_TIMEOUT_MS),
  });

  if (response.status === HTTP_STATUS.NOT_FOUND) {
    return { alreadyGone: true };
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `Vercel API DELETE ${path} failed: ${response.status} ${body}`,
    );
  }

  return { alreadyGone: false };
}
