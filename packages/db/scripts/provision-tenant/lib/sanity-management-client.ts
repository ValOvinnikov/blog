// Sanity Management (HTTP) API — https://www.sanity.io/docs/http-reference/access-api.
// Distinct from `@sanity/client` (the data API used for content reads/writes,
// see `steps/seed-content.ts`) — project/dataset/CORS/token management lives
// on this separate, versioned management surface.
const SANITY_MANAGEMENT_API_BASE = 'https://api.sanity.io/v2021-06-07';

// Robot-token management moved to a separate, newer Access API surface — see
// https://www.sanity.io/docs/content-lake/http-auth — distinct from the
// `v2021-06-07` base every other endpoint in this file still uses.
const SANITY_ACCESS_API_BASE = 'https://api.sanity.io/v2026-07-10';

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

async function sanityAccessRequest<T>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${SANITY_ACCESS_API_BASE}${path}`, {
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
      `Sanity Access API ${init.method ?? 'GET'} ${path} failed: ${response.status} ${body}`,
    );
  }

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

export type TSanityDataset = { name: string };

export async function listSanityDatasets(input: {
  token: string;
  projectId: string;
}): Promise<TSanityDataset[]> {
  return sanityManagementRequest<TSanityDataset[]>(
    `/projects/${input.projectId}/datasets`,
    input.token,
  );
}

export async function addSanityCorsOrigin(input: {
  token: string;
  projectId: string;
  origin: string;
  allowCredentials?: boolean;
}): Promise<void> {
  await sanityManagementRequest(
    `/projects/${input.projectId}/cors`,
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

export type TSanityCorsOrigin = { id: string; origin: string };

export async function listSanityCorsOrigins(input: {
  token: string;
  projectId: string;
}): Promise<TSanityCorsOrigin[]> {
  return sanityManagementRequest<TSanityCorsOrigin[]>(
    `/projects/${input.projectId}/cors`,
    input.token,
  );
}

export type TSanityRobotToken = { id: string; token: string };

// Mints a project-scoped "robot" token via Sanity's Access API
// (`POST /access/project/:projectId/robots`) — the same mechanism
// `sanity tokens create` uses under the hood. `viewer` (read-only, step 4's
// persisted token) and `editor` (write, step 2's transient seed token) are
// the two roles this workflow ever mints, passed as a single-element
// `roleNames` membership rather than the old flat `role` field.
export async function createSanityRobotToken(input: {
  token: string;
  projectId: string;
  label: string;
  role: TSanityRobotRole;
}): Promise<TSanityRobotToken> {
  const result = await sanityAccessRequest<{
    id?: string;
    tokenId?: string;
    token?: string;
    key?: string;
  }>(`/access/project/${input.projectId}/robots`, input.token, {
    method: 'POST',
    body: JSON.stringify({
      label: input.label,
      memberships: [
        {
          resourceType: 'project',
          resourceId: input.projectId,
          roleNames: [input.role],
        },
      ],
    }),
  });

  // The Access API docs don't fully spell out the response shape — falling
  // back from `id` to `tokenId`, and from `token` to `key`, guards against
  // either field name until a real provisioning run confirms which one the
  // API actually sends.
  const robotId = result.id ?? result.tokenId;
  const mintedToken = result.token ?? result.key;
  if (!robotId || !mintedToken) {
    throw new Error(
      `Sanity Access API: robot token creation for project "${input.projectId}" returned no id/token.`,
    );
  }

  return { id: robotId, token: mintedToken };
}

export async function deleteSanityRobotToken(input: {
  token: string;
  projectId: string;
  robotId: string;
}): Promise<void> {
  await sanityAccessRequest(
    `/access/project/${input.projectId}/robots/${input.robotId}`,
    input.token,
    { method: 'DELETE' },
  );
}

export type TSanityProjectMemberRole = 'administrator' | 'editor' | 'viewer';

export type TSanityInvite = { email?: string; status?: string };

// Lists both pending and already-accepted invites — an accepted invite
// means the invitee is already a project member, so a retry must still
// recognize them as "already invited" even once `status` is no longer
// `pending`.
export async function listSanityProjectInvites(input: {
  token: string;
  projectId: string;
}): Promise<TSanityInvite[]> {
  const result = await sanityAccessRequest<
    | { items?: Array<{ email?: string; status?: string }> }
    | Array<{ email?: string; status?: string }>
  >(
    `/access/project/${input.projectId}/invites?status=pending&status=accepted`,
    input.token,
  );

  const items = Array.isArray(result) ? result : (result.items ?? []);
  return items.map((item) => ({ email: item.email, status: item.status }));
}

// Invites a human by email to join the project as a member — distinct from
// `createSanityRobotToken`, which mints a non-human API token. The invitee
// receives an email from Sanity and must accept it before they can sign in.
export async function createSanityProjectInvite(input: {
  token: string;
  projectId: string;
  email: string;
  role: TSanityProjectMemberRole;
}): Promise<void> {
  await sanityAccessRequest(
    `/access/project/${input.projectId}/invites`,
    input.token,
    {
      method: 'POST',
      body: JSON.stringify({ email: input.email, role: input.role }),
    },
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
