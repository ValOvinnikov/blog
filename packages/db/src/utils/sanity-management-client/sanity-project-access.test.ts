import { HTTP_METHOD, HTTP_STATUS, SANITY_PROJECT_ROLE } from '@blog/config';
import {
  emptyResponse,
  firstFetchCall,
  jsonResponse,
  textResponse,
  useFetchFake,
} from '@blog/db/testing/sanity-management-client/fetch-fake';
import {
  MOCK_SANITY_ERROR_BODY,
  MOCK_SANITY_EXPECTED_URL,
  MOCK_SANITY_INVITE_EMAIL,
  MOCK_SANITY_INVITE_ID,
  MOCK_SANITY_PROJECT_USER_ID,
  mockSanityProjectInput,
} from '@blog/db/testing/sanity-management-client/fixtures';

import {
  createSanityProjectInvite,
  deleteSanityProjectInvite,
  grantSanityProjectRole,
  listSanityProjectAcl,
  listSanityProjectInvites,
  revokeSanityProjectRole,
} from './sanity-project-access';

const MOCK_CREATE_INVITE_INPUT = mockSanityProjectInput({
  email: MOCK_SANITY_INVITE_EMAIL,
  role: SANITY_PROJECT_ROLE.EDITOR,
});
const MOCK_GRANT_ROLE_INPUT = mockSanityProjectInput({
  projectUserId: MOCK_SANITY_PROJECT_USER_ID,
  role: SANITY_PROJECT_ROLE.ADMINISTRATOR,
});
const MOCK_REVOKE_ROLE_INPUT = mockSanityProjectInput({
  projectUserId: MOCK_SANITY_PROJECT_USER_ID,
  roleName: SANITY_PROJECT_ROLE.VIEWER,
});

const fetchMock = useFetchFake();

describe(listSanityProjectInvites, () => {
  it('GETs pending and accepted invites, unwrapping the `data` envelope', async () => {
    const invites = [{ email: MOCK_SANITY_INVITE_EMAIL, status: 'pending' }];
    fetchMock.mockResolvedValue(
      jsonResponse({ data: invites, nextCursor: null }),
    );

    const result = await listSanityProjectInvites(mockSanityProjectInput({}));

    const { url, method } = firstFetchCall(fetchMock);
    expect(result).toEqual(invites);
    expect(url).toBe(MOCK_SANITY_EXPECTED_URL.pendingAndAcceptedInvites);
    expect(method).toBe(HTTP_METHOD.GET);
  });

  it('accepts a bare array response with no envelope', async () => {
    const invites = [{ email: MOCK_SANITY_INVITE_EMAIL, status: 'accepted' }];
    fetchMock.mockResolvedValue(jsonResponse(invites));

    const result = await listSanityProjectInvites(mockSanityProjectInput({}));

    expect(result).toEqual(invites);
  });
});

describe(deleteSanityProjectInvite, () => {
  const MOCK_DELETE_INVITE_INPUT = mockSanityProjectInput({
    inviteId: MOCK_SANITY_INVITE_ID,
  });

  it('DELETEs the invite by id', async () => {
    fetchMock.mockResolvedValue(emptyResponse(HTTP_STATUS.NO_CONTENT));

    await deleteSanityProjectInvite(MOCK_DELETE_INVITE_INPUT);

    const { url, method } = firstFetchCall(fetchMock);
    expect(url).toBe(MOCK_SANITY_EXPECTED_URL.invite);
    expect(method).toBe(HTTP_METHOD.DELETE);
  });

  it('treats an invite that is already gone as revoked', async () => {
    fetchMock.mockResolvedValue(
      textResponse(MOCK_SANITY_ERROR_BODY, HTTP_STATUS.NOT_FOUND),
    );

    await expect(
      deleteSanityProjectInvite(MOCK_DELETE_INVITE_INPUT),
    ).resolves.toBeUndefined();
  });

  it('throws on any other failure', async () => {
    fetchMock.mockResolvedValue(
      textResponse(MOCK_SANITY_ERROR_BODY, HTTP_STATUS.FORBIDDEN),
    );

    await expect(
      deleteSanityProjectInvite(MOCK_DELETE_INVITE_INPUT),
    ).rejects.toThrow(new RegExp(`${HTTP_STATUS.FORBIDDEN}`));
  });
});

describe(createSanityProjectInvite, () => {
  it('POSTs the email + role to the project-scoped invites endpoint', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ id: MOCK_SANITY_INVITE_ID, status: 'pending' }),
    );

    await createSanityProjectInvite(MOCK_CREATE_INVITE_INPUT);

    const { url, body, method } = firstFetchCall(fetchMock);
    expect(url).toBe(MOCK_SANITY_EXPECTED_URL.invites);
    expect(method).toBe(HTTP_METHOD.POST);
    expect(body).toEqual({
      email: MOCK_CREATE_INVITE_INPUT.email,
      role: MOCK_CREATE_INVITE_INPUT.role,
    });
  });

  it('throws with the response status when the invite is refused', async () => {
    fetchMock.mockResolvedValue(
      textResponse(MOCK_SANITY_ERROR_BODY, HTTP_STATUS.PAYMENT_REQUIRED),
    );

    await expect(
      createSanityProjectInvite(MOCK_CREATE_INVITE_INPUT),
    ).rejects.toThrow(new RegExp(`${HTTP_STATUS.PAYMENT_REQUIRED}`));
  });
});

describe(listSanityProjectAcl, () => {
  it('GETs the project-scoped acl endpoint and returns the list', async () => {
    const acl = [
      {
        projectUserId: MOCK_SANITY_PROJECT_USER_ID,
        roles: [{ name: SANITY_PROJECT_ROLE.VIEWER }],
        isRobot: false,
      },
    ];
    fetchMock.mockResolvedValue(jsonResponse(acl));

    const result = await listSanityProjectAcl(mockSanityProjectInput({}));

    const { url, method } = firstFetchCall(fetchMock);
    expect(result).toEqual(acl);
    expect(url).toBe(MOCK_SANITY_EXPECTED_URL.acl);
    expect(method).toBe(HTTP_METHOD.GET);
  });

  it('throws with the response status when the acl read fails', async () => {
    fetchMock.mockResolvedValue(
      textResponse(MOCK_SANITY_ERROR_BODY, HTTP_STATUS.FORBIDDEN),
    );

    await expect(
      listSanityProjectAcl(mockSanityProjectInput({})),
    ).rejects.toThrow(new RegExp(`${HTTP_STATUS.FORBIDDEN}`));
  });
});

describe(grantSanityProjectRole, () => {
  it('PUTs the roleName to the legacy acl endpoint keyed on projectUserId', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        { projectUserId: MOCK_SANITY_PROJECT_USER_ID },
        HTTP_STATUS.CREATED,
      ),
    );

    await grantSanityProjectRole(MOCK_GRANT_ROLE_INPUT);

    const { url, body, method } = firstFetchCall(fetchMock);
    expect(url).toBe(MOCK_SANITY_EXPECTED_URL.aclEntry);
    expect(method).toBe(HTTP_METHOD.PUT);
    expect(body).toEqual({ roleName: MOCK_GRANT_ROLE_INPUT.role });
  });

  it('throws with the response status when the grant fails', async () => {
    fetchMock.mockResolvedValue(
      textResponse(MOCK_SANITY_ERROR_BODY, HTTP_STATUS.FORBIDDEN),
    );

    await expect(grantSanityProjectRole(MOCK_GRANT_ROLE_INPUT)).rejects.toThrow(
      new RegExp(`${HTTP_STATUS.FORBIDDEN}`),
    );
  });
});

describe(revokeSanityProjectRole, () => {
  it('DELETEs the roleName from the legacy acl endpoint keyed on projectUserId', async () => {
    fetchMock.mockResolvedValue(emptyResponse(HTTP_STATUS.NO_CONTENT));

    await revokeSanityProjectRole(MOCK_REVOKE_ROLE_INPUT);

    const { url, body, method } = firstFetchCall(fetchMock);
    expect(url).toBe(MOCK_SANITY_EXPECTED_URL.aclEntry);
    expect(method).toBe(HTTP_METHOD.DELETE);
    expect(body).toEqual({ roleName: MOCK_REVOKE_ROLE_INPUT.roleName });
  });

  it('treats a member who is already gone as revoked', async () => {
    fetchMock.mockResolvedValue(
      textResponse(MOCK_SANITY_ERROR_BODY, HTTP_STATUS.NOT_FOUND),
    );

    await expect(
      revokeSanityProjectRole(MOCK_REVOKE_ROLE_INPUT),
    ).resolves.toBeUndefined();
  });

  it('throws when the revoke fails for any other reason', async () => {
    fetchMock.mockResolvedValue(
      textResponse(MOCK_SANITY_ERROR_BODY, HTTP_STATUS.FORBIDDEN),
    );

    await expect(
      revokeSanityProjectRole(MOCK_REVOKE_ROLE_INPUT),
    ).rejects.toThrow(new RegExp(`${HTTP_STATUS.FORBIDDEN}`));
  });
});
