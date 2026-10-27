import {
  HTTP_METHOD,
  HTTP_STATUS,
  type TSanityProjectRole,
} from '@blog/config';
import { SANITY_API_PATH } from '@blog/db/utils/sanity-management-client/sanity-api-paths';
import {
  sanityAccessRequest,
  sanityAccessResponse,
  sanityManagementRequest,
  sanityManagementResponse,
} from '@blog/db/utils/sanity-management-client/sanity-api-request';

export type TSanityInvite = {
  id?: string;
  email?: string;
  status?: string;
  createdAt?: string;
};

// The envelope key is `data`, not `items`; unwrapping the wrong one yields an empty list and a retried invite 400s.
export async function listSanityProjectInvites(input: {
  token: string;
  projectId: string;
}): Promise<TSanityInvite[]> {
  const result = await sanityAccessRequest<
    { data?: TSanityInvite[] } | TSanityInvite[]
  >(
    SANITY_API_PATH.projectInvitesPendingOrAccepted(input.projectId),
    input.token,
  );

  const items = Array.isArray(result) ? result : (result.data ?? []);
  return items.map(({ id, email, status, createdAt }) => ({
    id,
    email,
    status,
    createdAt,
  }));
}

export async function deleteSanityProjectInvite(input: {
  token: string;
  projectId: string;
  inviteId: string;
}): Promise<void> {
  await sanityAccessResponse(
    SANITY_API_PATH.projectInvite(input.projectId, input.inviteId),
    input.token,
    { method: HTTP_METHOD.DELETE },
    [HTTP_STATUS.NOT_FOUND],
  );
}

export async function createSanityProjectInvite(input: {
  token: string;
  projectId: string;
  email: string;
  role: TSanityProjectRole;
}): Promise<void> {
  await sanityAccessRequest(
    SANITY_API_PATH.projectInvites(input.projectId),
    input.token,
    {
      method: HTTP_METHOD.POST,
      body: JSON.stringify({ email: input.email, role: input.role }),
    },
  );
}

export type TSanityAclEntry = {
  projectUserId: string;
  roles: { name: string }[];
  isRobot: boolean;
};

// A pending invitee has no entry until they accept, so this listing doubles as the acceptance signal.
export async function listSanityProjectAcl(input: {
  token: string;
  projectId: string;
}): Promise<TSanityAclEntry[]> {
  return sanityManagementRequest<TSanityAclEntry[]>(
    SANITY_API_PATH.projectAcl(input.projectId),
    input.token,
  );
}

// Only the legacy Roles API grants `administrator`; the Access API 403s even for the project owner. Key on `projectUserId`, never a `sanityUserId`, which 400s.
export async function grantSanityProjectRole(input: {
  token: string;
  projectId: string;
  projectUserId: string;
  role: TSanityProjectRole;
}): Promise<void> {
  await sanityManagementRequest(
    SANITY_API_PATH.projectAclEntry(input.projectId, input.projectUserId),
    input.token,
    { method: HTTP_METHOD.PUT, body: JSON.stringify({ roleName: input.role }) },
  );
}

// A member whose last role is removed leaves the project.
export async function revokeSanityProjectRole(input: {
  token: string;
  projectId: string;
  projectUserId: string;
  roleName: string;
}): Promise<void> {
  await sanityManagementResponse(
    SANITY_API_PATH.projectAclEntry(input.projectId, input.projectUserId),
    input.token,
    {
      method: HTTP_METHOD.DELETE,
      body: JSON.stringify({ roleName: input.roleName }),
    },
    [HTTP_STATUS.NOT_FOUND],
  );
}
