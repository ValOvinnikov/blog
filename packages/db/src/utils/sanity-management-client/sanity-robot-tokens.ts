import {
  HTTP_METHOD,
  SANITY_RESOURCE_TYPE,
  type TMaybeUndefined,
  type TSanityRobotRole,
} from '@shinefold/config';
import { SANITY_API_PATH } from '@shinefold/db/utils/sanity-management-client/sanity-api-paths';
import {
  sanityAccessRequest,
  sanityManagementRequest,
} from '@shinefold/db/utils/sanity-management-client/sanity-api-request';
import { isUndefined } from '@shinefold/utils/primitives';

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
  }>(SANITY_API_PATH.projectRobots(input.projectId), input.token, {
    method: HTTP_METHOD.POST,
    body: JSON.stringify({
      label: input.label,
      memberships: [
        {
          resourceType: SANITY_RESOURCE_TYPE.PROJECT,
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
  label: TMaybeUndefined<string>;
};

export async function listSanityRobotTokens(input: {
  token: string;
  projectId: string;
}): Promise<TSanityRobotTokenSummary[]> {
  const result = await sanityAccessRequest<
    | { data?: Array<{ id?: string; tokenId?: string; label?: string }> }
    | Array<{ id?: string; tokenId?: string; label?: string }>
  >(SANITY_API_PATH.projectRobots(input.projectId), input.token);

  const items = Array.isArray(result) ? result : (result.data ?? []);
  return items
    .map((item) => ({ id: item.id ?? item.tokenId, label: item.label }))
    .filter((item): item is TSanityRobotTokenSummary => !isUndefined(item.id));
}

export async function deleteSanityRobotToken(input: {
  token: string;
  projectId: string;
  robotId: string;
}): Promise<void> {
  await sanityAccessRequest(
    SANITY_API_PATH.projectRobot(input.projectId, input.robotId),
    input.token,
    { method: HTTP_METHOD.DELETE },
  );
}

export async function getSanityTokenUserId(token: string): Promise<string> {
  const { id } = await sanityManagementRequest<{ id?: string }>(
    SANITY_API_PATH.currentUser(),
    token,
  );
  if (!id) {
    throw new Error('Sanity Management API: /users/me returned no id.');
  }
  return id;
}
