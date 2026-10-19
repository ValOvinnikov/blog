import {
  sanityAccessRequest,
  sanityManagementRequest,
} from '@blog/db/utils/sanity-management-client/sanity-api-request';

export type TSanityProjectMemberRole = 'administrator' | 'editor' | 'viewer';

export type TSanityInvite = { email?: string; status?: string };

// The envelope key is `data`, not `items`; unwrapping the wrong one yields an empty list and a retried invite 400s.
export async function listSanityProjectInvites(input: {
  token: string;
  projectId: string;
}): Promise<TSanityInvite[]> {
  const result = await sanityAccessRequest<
    | { data?: Array<{ email?: string; status?: string }> }
    | Array<{ email?: string; status?: string }>
  >(
    `/access/project/${input.projectId}/invites?status=pending&status=accepted`,
    input.token,
  );

  const items = Array.isArray(result) ? result : (result.data ?? []);
  return items.map((item) => ({ email: item.email, status: item.status }));
}

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
    `/projects/${input.projectId}/acl/`,
    input.token,
  );
}

// Only the legacy Roles API grants `administrator`; the Access API 403s even for the project owner. Key on `projectUserId`, never a `sanityUserId`, which 400s.
export async function grantSanityProjectRole(input: {
  token: string;
  projectId: string;
  projectUserId: string;
  role: TSanityProjectMemberRole;
}): Promise<void> {
  await sanityManagementRequest(
    `/projects/${input.projectId}/acl/${input.projectUserId}`,
    input.token,
    { method: 'PUT', body: JSON.stringify({ roleName: input.role }) },
  );
}
