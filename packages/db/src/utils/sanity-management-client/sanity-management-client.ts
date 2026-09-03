// Sanity Management (HTTP) API — https://www.sanity.io/docs/http-reference/access-api.
// Deleting a project also deletes its dataset(s), CORS entries, and any
// robot tokens minted under it — nothing further to clean up separately.
export const SANITY_MANAGEMENT_API_BASE = 'https://api.sanity.io/v2021-06-07';

// This Access API surface (https://www.sanity.io/docs/content-lake/http-auth)
// backs robot-token management below and the invite endpoints in
// provision-tenant's scripts-side client — distinct from the `v2021-06-07`
// base every other endpoint in this file uses.
const SANITY_ACCESS_API_BASE = 'https://api.sanity.io/v2026-07-10';

export type TSanityDeleteResult = {
  outcome:
    | 'deleted'
    | 'already-gone'
    // Sanity rejected the deletion specifically because it requires org
    // billing permission — a permission scope `SANITY_MANAGEMENT_TOKEN`
    // deliberately doesn't have. Every other failure still throws.
    | 'blocked-by-billing-permission';
};

export async function deleteSanityProject(input: {
  token: string;
  projectId: string;
}): Promise<TSanityDeleteResult> {
  const response = await fetch(
    `${SANITY_MANAGEMENT_API_BASE}/projects/${input.projectId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${input.token}` },
    },
  );

  if (response.status === 404) {
    return { outcome: 'already-gone' };
  }

  if (response.status === 401) {
    const body = await response.text().catch(() => '');
    if (body.toLowerCase().includes('billing permission')) {
      return { outcome: 'blocked-by-billing-permission' };
    }
    throw new Error(
      `Sanity Management API DELETE /projects/${input.projectId} failed: ${response.status} ${body}`,
    );
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `Sanity Management API DELETE /projects/${input.projectId} failed: ${response.status} ${body}`,
    );
  }

  return { outcome: 'deleted' };
}

// `isDisabledByUser` is the archive flag Sanity's Manage UI itself writes —
// confirmed against the live API (a project it lists as Archived reads
// `isDisabledByUser: true`, `isDisabled: false`). Unlike project deletion,
// PATCHing it does not require org billing permission, so neither direction
// tolerates that failure the way `deleteSanityProject` does — any non-2xx
// here throws. Shared by `archiveSanityProject`/`unarchiveSanityProject`,
// which only differ in the target value and how they label the outcome.
async function setSanityProjectDisabledByUser(input: {
  token: string;
  projectId: string;
  disabled: boolean;
}): Promise<'changed' | 'already-in-state' | 'already-gone'> {
  const getResponse = await fetch(
    `${SANITY_MANAGEMENT_API_BASE}/projects/${input.projectId}`,
    { headers: { Authorization: `Bearer ${input.token}` } },
  );

  if (getResponse.status === 404) {
    return 'already-gone';
  }

  if (!getResponse.ok) {
    const body = await getResponse.text().catch(() => '');
    throw new Error(
      `Sanity Management API GET /projects/${input.projectId} failed: ${getResponse.status} ${body}`,
    );
  }

  const project = (await getResponse.json()) as { isDisabledByUser?: boolean };
  if (Boolean(project.isDisabledByUser) === input.disabled) {
    return 'already-in-state';
  }

  const patchResponse = await fetch(
    `${SANITY_MANAGEMENT_API_BASE}/projects/${input.projectId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${input.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isDisabledByUser: input.disabled }),
    },
  );

  if (!patchResponse.ok) {
    const body = await patchResponse.text().catch(() => '');
    throw new Error(
      `Sanity Management API PATCH /projects/${input.projectId} failed: ${patchResponse.status} ${body}`,
    );
  }

  return 'changed';
}

export type TSanityArchiveResult = {
  outcome: 'archived' | 'already-archived' | 'already-gone';
};

export async function archiveSanityProject(input: {
  token: string;
  projectId: string;
}): Promise<TSanityArchiveResult> {
  const result = await setSanityProjectDisabledByUser({
    ...input,
    disabled: true,
  });

  if (result === 'already-gone') return { outcome: 'already-gone' };
  if (result === 'already-in-state') return { outcome: 'already-archived' };
  return { outcome: 'archived' };
}

export type TSanityUnarchiveResult = {
  outcome: 'unarchived' | 'already-active' | 'already-gone';
};

// Reverses `archiveSanityProject` for a re-provisioned tenant — see
// `provision-tenant/run.ts`, called right after `reactivateTenant` flips the
// `tenants` row back to ACTIVE, since without this the project's API/CDN
// access stays blocked even though the row now reads active.
export async function unarchiveSanityProject(input: {
  token: string;
  projectId: string;
}): Promise<TSanityUnarchiveResult> {
  const result = await setSanityProjectDisabledByUser({
    ...input,
    disabled: false,
  });

  if (result === 'already-gone') return { outcome: 'already-gone' };
  if (result === 'already-in-state') return { outcome: 'already-active' };
  return { outcome: 'unarchived' };
}

export async function sanityAccessRequest<T>(
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

export type TSanityRobotRole = 'viewer' | 'editor';

export type TSanityRobotToken = { id: string; token: string };

// Mints a project-scoped "robot" token via Sanity's Access API
// (`POST /access/project/:projectId/robots`) — the same mechanism
// `sanity tokens create` uses under the hood. `viewer` (read-only) and
// `editor` (write) are the two roles ever minted, passed as a
// single-element `roleNames` membership rather than the old flat `role`
// field.
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

export type TSanityRobotTokenSummary = {
  id: string;
  label: string | undefined;
};

// Accepts either a bare array or a `{ data: [...] }` envelope, and drops
// any entry with no resolvable id.
export async function listSanityRobotTokens(input: {
  token: string;
  projectId: string;
}): Promise<TSanityRobotTokenSummary[]> {
  const result = await sanityAccessRequest<
    | { data?: Array<{ id?: string; tokenId?: string; label?: string }> }
    | Array<{ id?: string; tokenId?: string; label?: string }>
  >(`/access/project/${input.projectId}/robots`, input.token);

  const items = Array.isArray(result) ? result : (result.data ?? []);
  return items
    .map((item) => ({ id: item.id ?? item.tokenId, label: item.label }))
    .filter((item): item is TSanityRobotTokenSummary => item.id !== undefined);
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
