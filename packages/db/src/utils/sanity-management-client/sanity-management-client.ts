// Sanity Management (HTTP) API — https://www.sanity.io/docs/http-reference/access-api.
// Deleting a project also deletes its dataset(s), CORS entries, and any
// robot tokens minted under it — nothing further to clean up separately.
const SANITY_MANAGEMENT_API_BASE = 'https://api.sanity.io/v2021-06-07';

export type TSanityDeleteResult = {
  alreadyGone: boolean;
  // True when Sanity rejected the deletion specifically because it requires
  // org billing permission — a permission scope `SANITY_MANAGEMENT_TOKEN`
  // deliberately doesn't have. Every other failure still throws.
  blockedByBillingPermission?: boolean;
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
    return { alreadyGone: true };
  }

  if (response.status === 401) {
    const body = await response.text().catch(() => '');
    if (body.toLowerCase().includes('billing permission')) {
      return { alreadyGone: false, blockedByBillingPermission: true };
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

  return { alreadyGone: false };
}

export type TSanityArchiveResult = {
  outcome: 'archived' | 'already-archived' | 'already-gone';
};

// `isDisabledByUser` is the archive flag Sanity's Manage UI itself writes —
// confirmed against the live API (a project it lists as Archived reads
// `isDisabledByUser: true`, `isDisabled: false`). Unlike project deletion,
// PATCHing it does not require org billing permission, so archiving is not
// tolerant of that failure the way `deleteSanityProject` is — any non-2xx
// here throws.
export async function archiveSanityProject(input: {
  token: string;
  projectId: string;
}): Promise<TSanityArchiveResult> {
  const getResponse = await fetch(
    `${SANITY_MANAGEMENT_API_BASE}/projects/${input.projectId}`,
    { headers: { Authorization: `Bearer ${input.token}` } },
  );

  if (getResponse.status === 404) {
    return { outcome: 'already-gone' };
  }

  if (!getResponse.ok) {
    const body = await getResponse.text().catch(() => '');
    throw new Error(
      `Sanity Management API GET /projects/${input.projectId} failed: ${getResponse.status} ${body}`,
    );
  }

  const project = (await getResponse.json()) as { isDisabledByUser?: boolean };
  if (project.isDisabledByUser) {
    return { outcome: 'already-archived' };
  }

  const patchResponse = await fetch(
    `${SANITY_MANAGEMENT_API_BASE}/projects/${input.projectId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${input.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isDisabledByUser: true }),
    },
  );

  if (!patchResponse.ok) {
    const body = await patchResponse.text().catch(() => '');
    throw new Error(
      `Sanity Management API PATCH /projects/${input.projectId} failed: ${patchResponse.status} ${body}`,
    );
  }

  return { outcome: 'archived' };
}
