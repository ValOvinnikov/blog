import { sanityAccessRequest } from '@blog/db/utils/sanity-management-client/sanity-api-request';

export type TSanityRobotRole = 'viewer' | 'editor';

export type TSanityRobotToken = { id: string; token: string };

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
