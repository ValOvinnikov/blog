// Vercel REST API — https://vercel.com/docs/rest-api.
const VERCEL_API_BASE = 'https://api.vercel.com';

function withTeamId(path: string, teamId: string | undefined): string {
  if (!teamId) return path;
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}teamId=${encodeURIComponent(teamId)}`;
}

async function vercelRequest<T>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${VERCEL_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `Vercel API ${init.method ?? 'GET'} ${path} failed: ${response.status} ${body}`,
    );
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export type TVercelProject = { id: string; name: string };

export async function createVercelProject(input: {
  token: string;
  teamId: string | undefined;
  name: string;
  rootDirectory: string;
  gitRepository: string;
}): Promise<TVercelProject> {
  return vercelRequest<TVercelProject>(
    withTeamId('/v11/projects', input.teamId),
    input.token,
    {
      method: 'POST',
      body: JSON.stringify({
        name: input.name,
        rootDirectory: input.rootDirectory,
        framework: 'sanity',
        gitRepository: { repo: input.gitRepository, type: 'github' },
      }),
    },
  );
}

export type TVercelDomain = { name: string };

export async function listVercelProjectDomains(input: {
  token: string;
  teamId: string | undefined;
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
  teamId: string | undefined;
  projectId: string;
  domain: string;
}): Promise<TVercelDomain> {
  return vercelRequest<TVercelDomain>(
    withTeamId(`/v10/projects/${input.projectId}/domains`, input.teamId),
    input.token,
    { method: 'POST', body: JSON.stringify({ name: input.domain }) },
  );
}
