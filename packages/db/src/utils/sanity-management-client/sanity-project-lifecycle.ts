import {
  SANITY_API_TIMEOUT_MS,
  SANITY_MANAGEMENT_API_BASE,
} from '@blog/db/utils/sanity-management-client/sanity-api-request';

export type TSanityDeleteResult = {
  outcome: 'deleted' | 'already-gone' | 'blocked-by-billing-permission';
};

export async function deleteSanityProject(input: {
  token: string;
  projectId: string;
}): Promise<TSanityDeleteResult> {
  const response = await fetch(
    `${SANITY_MANAGEMENT_API_BASE}/projects/${input.projectId}`,
    {
      method: 'DELETE',
      signal: AbortSignal.timeout(SANITY_API_TIMEOUT_MS),
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

// Unlike deletion, PATCHing `isDisabledByUser` needs no org billing permission, so any non-2xx throws.
async function setSanityProjectDisabledByUser(input: {
  token: string;
  projectId: string;
  disabled: boolean;
}): Promise<'changed' | 'already-in-state' | 'already-gone'> {
  const getResponse = await fetch(
    `${SANITY_MANAGEMENT_API_BASE}/projects/${input.projectId}`,
    {
      signal: AbortSignal.timeout(SANITY_API_TIMEOUT_MS),
      headers: { Authorization: `Bearer ${input.token}` },
    },
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
      signal: AbortSignal.timeout(SANITY_API_TIMEOUT_MS),
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
