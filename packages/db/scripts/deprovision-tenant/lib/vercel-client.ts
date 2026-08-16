// Vercel REST API — https://vercel.com/docs/rest-api.
const VERCEL_API_BASE = 'https://api.vercel.com';

function withTeamId(path: string, teamId: string | undefined): string {
  if (!teamId) return path;
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}teamId=${encodeURIComponent(teamId)}`;
}

export type TVercelDeleteResult = { alreadyGone: boolean };

// A 404 means the resource is already gone — treated as success so a step
// retried after a previous run already deleted it doesn't fail.
async function vercelDelete(
  path: string,
  token: string,
): Promise<TVercelDeleteResult> {
  const response = await fetch(`${VERCEL_API_BASE}${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 404) {
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

export async function deleteVercelProjectDomain(input: {
  token: string;
  teamId: string | undefined;
  projectId: string;
  domain: string;
}): Promise<TVercelDeleteResult> {
  return vercelDelete(
    withTeamId(
      `/v9/projects/${input.projectId}/domains/${input.domain}`,
      input.teamId,
    ),
    input.token,
  );
}

export async function deleteVercelProject(input: {
  token: string;
  teamId: string | undefined;
  projectId: string;
}): Promise<TVercelDeleteResult> {
  return vercelDelete(
    withTeamId(`/v9/projects/${input.projectId}`, input.teamId),
    input.token,
  );
}
