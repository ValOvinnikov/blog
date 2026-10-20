import {
  firstFetchCall,
  jsonResponse,
  textResponse,
  useFetchFake,
} from '@blog/db/testing/sanity-management-client/fetch-fake';
import {
  SANITY_EXPECTED_URL,
  SANITY_INVITE_EMAIL,
  SANITY_PROJECT_USER_ID,
  withSanityProject,
} from '@blog/db/testing/sanity-management-client/fixtures';

import {
  createSanityProjectInvite,
  grantSanityProjectRole,
  listSanityProjectAcl,
  listSanityProjectInvites,
} from './sanity-project-access';

const createInviteInput = withSanityProject({
  email: SANITY_INVITE_EMAIL,
  role: 'editor' as const,
});
const grantRoleInput = withSanityProject({
  projectUserId: SANITY_PROJECT_USER_ID,
  role: 'administrator' as const,
});

const fetchMock = useFetchFake();

describe(listSanityProjectInvites, () => {
  it('GETs pending and accepted invites, unwrapping the `data` envelope', async () => {
    const invites = [{ email: SANITY_INVITE_EMAIL, status: 'pending' }];
    fetchMock.mockResolvedValue(
      jsonResponse({ data: invites, nextCursor: null }),
    );

    const result = await listSanityProjectInvites(withSanityProject({}));

    const { url, init } = firstFetchCall(fetchMock);
    expect(result).toEqual(invites);
    expect(url).toBe(SANITY_EXPECTED_URL.pendingAndAcceptedInvites);
    expect(init.method ?? 'GET').toBe('GET');
  });

  it('accepts a bare array response with no envelope', async () => {
    const invites = [{ email: SANITY_INVITE_EMAIL, status: 'accepted' }];
    fetchMock.mockResolvedValue(jsonResponse(invites));

    const result = await listSanityProjectInvites(withSanityProject({}));

    expect(result).toEqual(invites);
  });
});

describe(createSanityProjectInvite, () => {
  it('POSTs the email + role to the project-scoped invites endpoint', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ id: 'invite1', status: 'pending' }),
    );

    await createSanityProjectInvite(createInviteInput);

    const { url, init, body } = firstFetchCall(fetchMock);
    expect(url).toBe(SANITY_EXPECTED_URL.invites);
    expect(init.method).toBe('POST');
    expect(body).toEqual({
      email: createInviteInput.email,
      role: createInviteInput.role,
    });
  });

  it('throws with the response status and body on failure', async () => {
    fetchMock.mockResolvedValue(textResponse('nope', 402));

    await expect(createSanityProjectInvite(createInviteInput)).rejects.toThrow(
      /402/,
    );
  });
});

describe(listSanityProjectAcl, () => {
  it('GETs the project-scoped acl endpoint and returns the list', async () => {
    const acl = [
      {
        projectUserId: SANITY_PROJECT_USER_ID,
        roles: [{ name: 'viewer' }],
        isRobot: false,
      },
    ];
    fetchMock.mockResolvedValue(jsonResponse(acl));

    const result = await listSanityProjectAcl(withSanityProject({}));

    const { url, init } = firstFetchCall(fetchMock);
    expect(result).toEqual(acl);
    expect(url).toBe(SANITY_EXPECTED_URL.acl);
    expect(init.method ?? 'GET').toBe('GET');
  });

  it('throws with the response status and body on failure', async () => {
    fetchMock.mockResolvedValue(textResponse('nope', 403));

    await expect(listSanityProjectAcl(withSanityProject({}))).rejects.toThrow(
      /403/,
    );
  });
});

describe(grantSanityProjectRole, () => {
  it('PUTs the roleName to the legacy acl endpoint keyed on projectUserId', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ projectUserId: SANITY_PROJECT_USER_ID }, 201),
    );

    await grantSanityProjectRole(grantRoleInput);

    const { url, init, body } = firstFetchCall(fetchMock);
    expect(url).toBe(SANITY_EXPECTED_URL.aclEntry);
    expect(init.method).toBe('PUT');
    expect(body).toEqual({ roleName: grantRoleInput.role });
  });

  it('throws with the response status and body on failure', async () => {
    fetchMock.mockResolvedValue(textResponse('nope', 403));

    await expect(grantSanityProjectRole(grantRoleInput)).rejects.toThrow(/403/);
  });
});
