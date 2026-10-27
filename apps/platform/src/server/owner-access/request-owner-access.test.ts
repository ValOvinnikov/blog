import {
  ACTION_OUTCOME,
  HTTP_STATUS,
  NEXT_NAVIGATION_ERROR,
  type TMaybeNull,
} from '@blog/config';
import { queries } from '@blog/db';
import { ADMIN_ROLE } from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import { OWNER_ACCESS_LOG } from '@platform/constants/owner-access';
import { WORKER_LOG } from '@platform/constants/worker';
import { auth } from '@platform/server/auth/auth';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { env } from '@platform/utils/env/env';
import { logger } from '@platform/utils/logger/logger';
import type { Session } from 'next-auth';

import { checkOwnerAccessAction } from './check-owner-access-action';
import {
  enqueueOwnerAccessRequest,
  requestOwnerAccess,
} from './request-owner-access';
import { resendOwnerInviteAction } from './resend-owner-invite-action';

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/utils/env/env');

vi.mock('@blog/db', async () => {
  const { mockDbConstants } =
    await import('@platform/testing/mock-db-constants');

  return {
    ...(await mockDbConstants()),
    queries: {
      memberships: { getMembership: vi.fn() },
      admins: { getAdminByUserId: vi.fn() },
    },
  };
});

faker.seed(6105);

const MOCK_USER_ID = faker.string.uuid();
const MOCK_WORKER_PATH = `/${faker.lorem.slug()}`;
const MOCK_WORKER_URL = `https://${faker.internet.domainName()}`;
const MOCK_SECRET = faker.string.alphanumeric(32);
const MOCK_NETWORK_ERROR = new Error(faker.lorem.words(2));

const envMock: Partial<Record<keyof typeof env, string>> = env;
const authMock = vi.mocked<() => Promise<TMaybeNull<Partial<Session>>>>(auth);
const getMembership = vi.mocked(queries.memberships.getMembership);
const getAdminByUserId = vi.mocked(queries.admins.getAdminByUserId);
const fetchMock = vi.fn<(url: URL) => Promise<Response>>();

const requestedUrls = (): string[] =>
  fetchMock.mock.calls.map(([url]) => url.href);

beforeEach(() => {
  authMock.mockResolvedValue({ user: { id: MOCK_USER_ID } });
  getAdminByUserId.mockReset();
  getAdminByUserId.mockResolvedValue(undefined);
  getMembership.mockReset();
  getMembership.mockResolvedValue(mockMembership({ userId: MOCK_USER_ID }));
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(
    new Response(null, { status: HTTP_STATUS.ACCEPTED }),
  );
  vi.stubGlobal('fetch', fetchMock);
  envMock.WORKER_ENQUEUE_URL = MOCK_WORKER_URL;
  envMock.WORKER_ENQUEUE_SECRET = MOCK_SECRET;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe(requestOwnerAccess, () => {
  it('calls nothing on the worker for a user who is not the owner', async () => {
    getMembership.mockResolvedValue(undefined);

    await expect(
      requestOwnerAccess(MOCK_WORKER_PATH, MOCK_TENANT_ID),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('admits a super-admin who has no membership', async () => {
    getAdminByUserId.mockResolvedValue(
      mockAdmin({ userId: MOCK_USER_ID, role: ADMIN_ROLE.SUPERADMIN }),
    );
    getMembership.mockResolvedValue(undefined);

    const result = await requestOwnerAccess(MOCK_WORKER_PATH, MOCK_TENANT_ID);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it('refuses an admin below super-admin who is not the owner', async () => {
    getAdminByUserId.mockResolvedValue(mockAdmin({ userId: MOCK_USER_ID }));
    getMembership.mockResolvedValue(undefined);

    await expect(
      requestOwnerAccess(MOCK_WORKER_PATH, MOCK_TENANT_ID),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("succeeds once the worker accepts the owner's request", async () => {
    const result = await requestOwnerAccess(MOCK_WORKER_PATH, MOCK_TENANT_ID);

    expect(requestedUrls()).toEqual([
      new URL(MOCK_WORKER_PATH, MOCK_WORKER_URL).href,
    ]);
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it('logs and fails when the worker answers anything else', async () => {
    fetchMock.mockResolvedValue(
      new Response(null, { status: HTTP_STATUS.CONFLICT }),
    );

    const result = await requestOwnerAccess(MOCK_WORKER_PATH, MOCK_TENANT_ID);

    expect(logger.error).toHaveBeenCalledWith(OWNER_ACCESS_LOG.REQUEST_FAILED, {
      tenantId: MOCK_TENANT_ID,
      path: MOCK_WORKER_PATH,
      responseStatus: HTTP_STATUS.CONFLICT,
    });
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
  });

  it('fails with only the network error logged when the worker is unreachable', async () => {
    fetchMock.mockRejectedValue(MOCK_NETWORK_ERROR);

    const result = await requestOwnerAccess(MOCK_WORKER_PATH, MOCK_TENANT_ID);

    const loggedEvents = vi
      .mocked(logger.error)
      .mock.calls.map(([event]) => event);
    expect(loggedEvents).toEqual([WORKER_LOG.ENQUEUE_ERROR]);
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
  });
});

describe(enqueueOwnerAccessRequest, () => {
  it('enqueues without a session for a caller that already checked access', async () => {
    authMock.mockResolvedValue(null);

    const result = await enqueueOwnerAccessRequest(
      MOCK_WORKER_PATH,
      MOCK_TENANT_ID,
    );

    expect(requestedUrls()).toEqual([
      new URL(MOCK_WORKER_PATH, MOCK_WORKER_URL).href,
    ]);
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
  });
});

describe('the owner-access actions', () => {
  it.each([
    [
      checkOwnerAccessAction.name,
      checkOwnerAccessAction,
      '/api/owner-access/check',
    ],
    [
      resendOwnerInviteAction.name,
      resendOwnerInviteAction,
      '/api/owner-access/resend',
    ],
  ])('%s requests its own worker path', async (_name, action, path) => {
    const result = await action(MOCK_TENANT_ID);

    expect(requestedUrls()).toEqual([new URL(path, MOCK_WORKER_URL).href]);
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
  });
});
