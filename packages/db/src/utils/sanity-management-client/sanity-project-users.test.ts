import { HTTP_METHOD, HTTP_STATUS, SANITY_PROJECT_ROLE } from '@blog/config';
import {
  firstFetchCall,
  jsonResponse,
  nthFetchCall,
  textResponse,
  useFetchFake,
} from '@blog/db/testing/sanity-management-client/fetch-fake';
import {
  SANITY_EXPECTED_URL,
  SANITY_INVITE_EMAIL,
  SANITY_ORGANIZATION_ID,
  SANITY_PROJECT_USER_ID,
  SANITY_TOKEN,
  SANITY_USER_ID,
  withSanityProject,
} from '@blog/db/testing/sanity-management-client/fixtures';

import {
  assignSanityProjectUserRole,
  listSanityOrganizationUsers,
  listSanityProjectUsers,
} from './sanity-project-users';

const user = {
  sanityUserId: SANITY_USER_ID,
  profile: {
    id: SANITY_PROJECT_USER_ID,
    email: SANITY_INVITE_EMAIL,
    provider: 'google',
  },
};
const secondUser = {
  sanityUserId: 'g-second',
  profile: { id: 'p-second', email: 'second@example.com' },
};

const fetchMock = useFetchFake();

describe(listSanityProjectUsers, () => {
  it('GETs the project users and unwraps the `data` envelope', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ data: [user], nextCursor: null }),
    );

    const result = await listSanityProjectUsers(withSanityProject({}));

    const { url, method } = firstFetchCall(fetchMock);
    expect(result).toEqual([user]);
    expect(url).toBe(SANITY_EXPECTED_URL.projectUsers);
    expect(method).toBe(HTTP_METHOD.GET);
  });

  it('follows `nextCursor` until every page is read', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ data: [user], nextCursor: 'c 2' }))
      .mockResolvedValueOnce(
        jsonResponse({ data: [secondUser], nextCursor: null }),
      );

    const result = await listSanityProjectUsers(withSanityProject({}));

    expect(result).toEqual([user, secondUser]);
    expect(nthFetchCall(fetchMock, 1).url).toBe(
      `${SANITY_EXPECTED_URL.projectUsers}?nextCursor=c%202`,
    );
  });

  it('throws with the response status on failure', async () => {
    fetchMock.mockResolvedValue(textResponse('nope', HTTP_STATUS.FORBIDDEN));

    await expect(listSanityProjectUsers(withSanityProject({}))).rejects.toThrow(
      new RegExp(`${HTTP_STATUS.FORBIDDEN}`),
    );
  });
});

describe(listSanityOrganizationUsers, () => {
  it('GETs the organization users', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ data: [user], nextCursor: null }),
    );

    const result = await listSanityOrganizationUsers({
      token: SANITY_TOKEN,
      organizationId: SANITY_ORGANIZATION_ID,
    });

    expect(result).toEqual([user]);
    expect(firstFetchCall(fetchMock).url).toBe(
      SANITY_EXPECTED_URL.organizationUsers,
    );
  });
});

describe(assignSanityProjectUserRole, () => {
  it('PUTs the role onto the user by Sanity user id', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));

    await assignSanityProjectUserRole(
      withSanityProject({
        sanityUserId: SANITY_USER_ID,
        role: SANITY_PROJECT_ROLE.VIEWER,
      }),
    );

    const { url, method } = firstFetchCall(fetchMock);
    expect(url).toBe(
      `${SANITY_EXPECTED_URL.projectUsers}/${SANITY_USER_ID}/roles/viewer`,
    );
    expect(method).toBe(HTTP_METHOD.PUT);
  });
});
