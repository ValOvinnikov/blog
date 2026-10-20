import {
  firstFetchCall,
  jsonResponse,
  SANITY_ACCESS_API_BASE,
  SANITY_TEST_PROJECT_ID,
  textResponse,
  useFetchFake,
  withSanityProject,
} from '@blog/db/testing/sanity-fetch';

import { SANITY_MANAGEMENT_API_BASE } from './sanity-api-request';
import {
  createSanityProjectInvite,
  grantSanityProjectRole,
  listSanityProjectAcl,
  listSanityProjectInvites,
} from './sanity-project-access';

const INVITE_EMAIL = 'owner@example.com';
const PROJECT_USER_ID = 'p123';
const ACCESS_INVITES_URL = `${SANITY_ACCESS_API_BASE}/access/project/${SANITY_TEST_PROJECT_ID}/invites`;
const LEGACY_ACL_URL = `${SANITY_MANAGEMENT_API_BASE}/projects/${SANITY_TEST_PROJECT_ID}/acl`;
const createInviteInput = withSanityProject({
  email: INVITE_EMAIL,
  role: 'editor' as const,
});
const grantRoleInput = withSanityProject({
  projectUserId: PROJECT_USER_ID,
  role: 'administrator' as const,
});

const fetchMock = useFetchFake();

describe(listSanityProjectInvites, () => {
  it('GETs pending and accepted invites, unwrapping the `data` envelope', async () => {
    const invites = [{ email: INVITE_EMAIL, status: 'pending' }];
    fetchMock.mockResolvedValue(
      jsonResponse({ data: invites, nextCursor: null }),
    );

    const result = await listSanityProjectInvites(withSanityProject({}));

    const { url, init } = firstFetchCall(fetchMock);
    expect(result).toEqual(invites);
    expect(url).toBe(`${ACCESS_INVITES_URL}?status=pending&status=accepted`);
    expect(init.method ?? 'GET').toBe('GET');
  });

  it('accepts a bare array response with no envelope', async () => {
    const invites = [{ email: INVITE_EMAIL, status: 'accepted' }];
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
    expect(url).toBe(ACCESS_INVITES_URL);
    expect(init.method).toBe('POST');
    expect(body).toEqual({ email: INVITE_EMAIL, role: 'editor' });
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
        projectUserId: PROJECT_USER_ID,
        roles: [{ name: 'viewer' }],
        isRobot: false,
      },
    ];
    fetchMock.mockResolvedValue(jsonResponse(acl));

    const result = await listSanityProjectAcl(withSanityProject({}));

    const { url, init } = firstFetchCall(fetchMock);
    expect(result).toEqual(acl);
    expect(url).toBe(`${LEGACY_ACL_URL}/`);
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
      jsonResponse({ projectUserId: PROJECT_USER_ID }, 201),
    );

    await grantSanityProjectRole(grantRoleInput);

    const { url, init, body } = firstFetchCall(fetchMock);
    expect(url).toBe(`${LEGACY_ACL_URL}/${PROJECT_USER_ID}`);
    expect(init.method).toBe('PUT');
    expect(body).toEqual({ roleName: 'administrator' });
  });

  it('throws with the response status and body on failure', async () => {
    fetchMock.mockResolvedValue(textResponse('nope', 403));

    await expect(grantSanityProjectRole(grantRoleInput)).rejects.toThrow(/403/);
  });
});
