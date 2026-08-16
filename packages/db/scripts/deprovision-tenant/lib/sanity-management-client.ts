// Sanity Management (HTTP) API — https://www.sanity.io/docs/http-reference/access-api.
// Deleting a project also deletes its dataset(s), CORS entries, and any
// robot tokens minted under it — nothing further to clean up separately.
const SANITY_MANAGEMENT_API_BASE = 'https://api.sanity.io/v2021-06-07';

export type TSanityDeleteResult = { alreadyGone: boolean };

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

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `Sanity Management API DELETE /projects/${input.projectId} failed: ${response.status} ${body}`,
    );
  }

  return { alreadyGone: false };
}
