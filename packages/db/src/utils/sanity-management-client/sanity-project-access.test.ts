import { HTTP_METHOD, HTTP_STATUS, SANITY_PROJECT_ROLE } from '@blog/config';
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
  role: SANITY_PROJECT_ROLE.EDITOR,
});
const grantRoleInput = withSanityProject({
  projectUserId: SANITY_PROJECT_USER_ID,
  role: SANITY_PROJECT_ROLE.ADMINISTRATOR,
});

const fetchMock = useFetchFake();

describe(listSanityProjectInvites, () => {
  it('GETs pending and accepted invites, unwrapping the `data` envelope', async () => {
    const invites = [{ email: SANITY_INVITE_EMAIL, status: 'pending' }];
    fetchMock.mockResolvedValue(
      jsonResponse({ data: invites, nextCursor: null }),
    );

    const result = await listSanityProjectInvites(withSanityProject({}));

    const { url, method } = firstFetchCall(fetchMock);
    expect(result).toEqual(invites);
    expect(url).toBe(SANITY_EXPECTED_URL.pendingAndAcceptedInvites);
    expect(method).toBe(HTTP_METHOD.GET);
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

    const { url, body, method } = firstFetchCall(fetchMock);
    expect(url).toBe(SANITY_EXPECTED_URL.invites);
    expect(method).toBe(HTTP_METHOD.POST);
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
        roles: [{ name: SANITY_PROJECT_ROLE.VIEWER }],
        isRobot: false,
      },
    ];
    fetchMock.mockResolvedValue(jsonResponse(acl));

    const result = await listSanityProjectAcl(withSanityProject({}));

    const { url, method } = firstFetchCall(fetchMock);
    expect(result).toEqual(acl);
    expect(url).toBe(SANITY_EXPECTED_URL.acl);
    expect(method).toBe(HTTP_METHOD.GET);
  });

  it('throws with the response status and body on failure', async () => {
    fetchMock.mockResolvedValue(textResponse('nope', HTTP_STATUS.FORBIDDEN));

    await expect(listSanityProjectAcl(withSanityProject({}))).rejects.toThrow(
      new RegExp(`${HTTP_STATUS.FORBIDDEN}`),
    );
  });
});

describe(grantSanityProjectRole, () => {
  it('PUTs the roleName to the legacy acl endpoint keyed on projectUserId', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        { projectUserId: SANITY_PROJECT_USER_ID },
        HTTP_STATUS.CREATED,
      ),
    );

    await grantSanityProjectRole(grantRoleInput);

    const { url, body, method } = firstFetchCall(fetchMock);
    expect(url).toBe(SANITY_EXPECTED_URL.aclEntry);
    expect(method).toBe(HTTP_METHOD.PUT);
    expect(body).toEqual({ roleName: grantRoleInput.role });
  });

  it('throws with the response status and body on failure', async () => {
    fetchMock.mockResolvedValue(textResponse('nope', HTTP_STATUS.FORBIDDEN));

    await expect(grantSanityProjectRole(grantRoleInput)).rejects.toThrow(
      new RegExp(`${HTTP_STATUS.FORBIDDEN}`),
    );
  });
});
