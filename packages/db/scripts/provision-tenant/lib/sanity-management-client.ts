// Sanity Management (HTTP) API — https://www.sanity.io/docs/http-reference/access-api.
// Distinct from `@sanity/client` (the data API used for content reads/writes,
// see `steps/seed-content.ts`) — project/dataset/CORS/token management lives
// on this separate, versioned management surface.
const SANITY_MANAGEMENT_API_BASE = 'https://api.sanity.io/v2021-06-07';

export type TSanityRobotRole = 'viewer' | 'editor';

async function sanityManagementRequest<T>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${SANITY_MANAGEMENT_API_BASE}${path}`, {
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
      `Sanity Management API ${init.method ?? 'GET'} ${path} failed: ${response.status} ${body}`,
    );
  }

  // DELETE (and some POSTs) return an empty 2xx body — `.json()` on that
  // throws, so only parse when there's actually a body to parse.
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export type TSanityProject = { id: string };

export async function createSanityProject(input: {
  token: string;
  displayName: string;
  organizationId: string;
}): Promise<TSanityProject> {
  return sanityManagementRequest<TSanityProject>('/projects', input.token, {
    method: 'POST',
    body: JSON.stringify({
      displayName: input.displayName,
      organizationId: input.organizationId,
    }),
  });
}

export async function createSanityDataset(input: {
  token: string;
  projectId: string;
  dataset: string;
}): Promise<void> {
  await sanityManagementRequest(
    `/projects/${input.projectId}/datasets/${input.dataset}`,
    input.token,
    { method: 'PUT', body: JSON.stringify({ aclMode: 'public' }) },
  );
}

export async function addSanityCorsOrigin(input: {
  token: string;
  projectId: string;
  origin: string;
  allowCredentials?: boolean;
}): Promise<void> {
  await sanityManagementRequest(
    `/projects/${input.projectId}/cors-origins`,
    input.token,
    {
      method: 'POST',
      body: JSON.stringify({
        origin: input.origin,
        allowCredentials: input.allowCredentials ?? false,
      }),
    },
  );
}

export type TSanityRobotToken = { id: string; token: string };

// Mints a project-scoped "robot" token via Sanity's Robots API
// (`POST /projects/:projectId/robots`) — the same mechanism
// `sanity tokens create` uses under the hood. `viewer` (read-only, step 4's
// persisted token) and `editor` (write, step 2's transient seed token) are
// the two roles this workflow ever mints.
export async function createSanityRobotToken(input: {
  token: string;
  projectId: string;
  label: string;
  role: TSanityRobotRole;
}): Promise<TSanityRobotToken> {
  const result = await sanityManagementRequest<{
    id: string;
    token?: string;
    key?: string;
  }>(`/projects/${input.projectId}/robots`, input.token, {
    method: 'POST',
    body: JSON.stringify({ label: input.label, role: input.role }),
  });

  const mintedToken = result.token ?? result.key;
  if (!mintedToken) {
    throw new Error(
      `Sanity Management API: robot token creation for project "${input.projectId}" returned no token.`,
    );
  }

  return { id: result.id, token: mintedToken };
}

export async function deleteSanityRobotToken(input: {
  token: string;
  projectId: string;
  robotId: string;
}): Promise<void> {
  await sanityManagementRequest(
    `/projects/${input.projectId}/robots/${input.robotId}`,
    input.token,
    { method: 'DELETE' },
  );
}

// Webhooks are documented against the project-scoped host
// (`{projectId}.api.sanity.io`), unlike every endpoint above, which all work
// against the generic `api.sanity.io` host — see
// https://www.sanity.io/docs/http-reference/webhooks.
function sanityWebhooksApiBase(projectId: string): string {
  return `https://${projectId}.api.sanity.io/v2021-06-07`;
}

async function sanityWebhooksRequest<T>(
  projectId: string,
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${sanityWebhooksApiBase(projectId)}${path}`, {
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
      `Sanity Webhooks API ${init.method ?? 'GET'} ${path} failed: ${response.status} ${body}`,
    );
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export type TSanityWebhook = { id: string; url: string };

export async function listSanityWebhooks(input: {
  token: string;
  projectId: string;
}): Promise<TSanityWebhook[]> {
  return sanityWebhooksRequest<TSanityWebhook[]>(
    input.projectId,
    `/hooks/projects/${input.projectId}`,
    input.token,
  );
}

export async function createSanityWebhook(input: {
  token: string;
  projectId: string;
  dataset: string;
  name: string;
  url: string;
  secret: string;
}): Promise<TSanityWebhook> {
  return sanityWebhooksRequest<TSanityWebhook>(
    input.projectId,
    `/hooks/projects/${input.projectId}`,
    input.token,
    {
      method: 'POST',
      body: JSON.stringify({
        type: 'document',
        name: input.name,
        dataset: input.dataset,
        url: input.url,
        apiVersion: 'v2021-06-07',
        httpMethod: 'POST',
        secret: input.secret,
      }),
    },
  );
}
