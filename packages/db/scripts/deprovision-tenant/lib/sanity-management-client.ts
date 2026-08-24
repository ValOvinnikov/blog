// Sanity Management (HTTP) API — https://www.sanity.io/docs/http-reference/access-api.
// Deleting a project also deletes its dataset(s), CORS entries, and any
// robot tokens minted under it — nothing further to clean up separately.
const SANITY_MANAGEMENT_API_BASE = 'https://api.sanity.io/v2021-06-07';

export type TSanityDeleteResult = {
  alreadyGone: boolean;
  // True when Sanity rejected the deletion specifically because it requires
  // org billing permission — a permission scope `SANITY_MANAGEMENT_TOKEN`
  // deliberately doesn't have (see `delete-sanity-project.ts`). Every other
  // failure still throws.
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
