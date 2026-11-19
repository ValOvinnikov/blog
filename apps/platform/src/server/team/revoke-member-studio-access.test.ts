import {
  MEMBER_ACCESS_PATH,
  MEMBER_ACCESS_REVOKE_RETRY_DELAYS_MS,
  TEAM_ACCESS_LOG,
} from '@platform/constants/team-access';
import { WORKER_LOG } from '@platform/constants/worker';
import { mockedEnv } from '@platform/testing/env/mocked-env';
import { MOCK_NETWORK_ERROR } from '@platform/testing/http/network-error';
import { requestedUrl } from '@platform/testing/http/requested-url';
import {
  MOCK_MEMBER_EMAIL,
  MOCK_SANITY_USER_ID,
} from '@platform/testing/team/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { MOCK_WORKER_URL } from '@platform/testing/worker/fixtures';
import {
  stubWorkerFetch,
  type TWorkerFetchMock,
} from '@platform/testing/worker/stub-worker-fetch';
import { logger } from '@platform/utils/logger/logger';
import { HTTP_STATUS } from '@shinefold/config';

import { revokeMemberStudioAccess } from './revoke-member-studio-access';

vi.mock('@platform/utils/env/env');

const [MOCK_FIRST_RETRY_DELAY_MS = 0, MOCK_SECOND_RETRY_DELAY_MS = 0] =
  MEMBER_ACCESS_REVOKE_RETRY_DELAYS_MS;
const MOCK_REMOVED = {
  memberEmail: MOCK_MEMBER_EMAIL,
  sanityUserId: MOCK_SANITY_USER_ID,
};

const fetchMock: TWorkerFetchMock = vi.fn();

const respondWith = (status: number) => new Response(null, { status });

const loggedEvents = () =>
  vi.mocked(logger.error).mock.calls.map(([event]) => event);

const revoke = async () => {
  const run = revokeMemberStudioAccess(MOCK_TENANT_ID, MOCK_REMOVED);
  await vi.runAllTimersAsync();
  await run;
};

describe(revokeMemberStudioAccess, () => {
  beforeEach(() => {
    vi.useFakeTimers();
    stubWorkerFetch(fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("sends the removed member's address and Sanity user to the revoke route", async () => {
    await revoke();

    const [, init] = fetchMock.mock.calls[0] ?? [];
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(requestedUrl(fetchMock, 0).href).toBe(
      new URL(MEMBER_ACCESS_PATH.REVOKE, MOCK_WORKER_URL).href,
    );
    expect(JSON.parse(String(init?.body))).toEqual({
      tenantId: MOCK_TENANT_ID,
      ...MOCK_REMOVED,
    });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('retries a failed request and logs nothing once one is accepted', async () => {
    fetchMock
      .mockImplementationOnce(async () =>
        respondWith(HTTP_STATUS.INTERNAL_SERVER_ERROR),
      )
      .mockRejectedValueOnce(MOCK_NETWORK_ERROR);

    await revoke();

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('gives up on a request the worker refuses as malformed', async () => {
    fetchMock.mockImplementation(async () =>
      respondWith(HTTP_STATUS.BAD_REQUEST),
    );

    await revoke();

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledExactlyOnceWith(
      TEAM_ACCESS_LOG.REVOKE_FAILED,
      { tenantId: MOCK_TENANT_ID, responseStatus: HTTP_STATUS.BAD_REQUEST },
    );
  });

  describe('when every attempt fails', () => {
    beforeEach(() => {
      fetchMock.mockImplementation(async () =>
        respondWith(HTTP_STATUS.INTERNAL_SERVER_ERROR),
      );
    });

    it('waits between the retries for the configured delays', async () => {
      const run = revokeMemberStudioAccess(MOCK_TENANT_ID, MOCK_REMOVED);
      await vi.advanceTimersByTimeAsync(MOCK_FIRST_RETRY_DELAY_MS - 1);
      expect(fetchMock).toHaveBeenCalledOnce();
      await vi.advanceTimersByTimeAsync(1);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      await vi.advanceTimersByTimeAsync(MOCK_SECOND_RETRY_DELAY_MS);
      await run;

      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('logs once after the third attempt with the last status', async () => {
      await revoke();

      expect(logger.error).toHaveBeenCalledExactlyOnceWith(
        TEAM_ACCESS_LOG.REVOKE_FAILED,
        {
          tenantId: MOCK_TENANT_ID,
          responseStatus: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        },
      );
    });
  });

  it('logs one line, naming the transport failure, when the worker is unreachable', async () => {
    fetchMock.mockRejectedValue(MOCK_NETWORK_ERROR);

    await revoke();

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(loggedEvents()).toEqual([TEAM_ACCESS_LOG.REVOKE_FAILED]);
    expect(logger.error).toHaveBeenCalledWith(
      TEAM_ACCESS_LOG.REVOKE_FAILED,
      expect.objectContaining({ cause: WORKER_LOG.ENQUEUE_ERROR }),
    );
  });

  it('logs one line when the worker is not configured', async () => {
    mockedEnv.WORKER_ENQUEUE_URL = undefined;

    await revoke();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(loggedEvents()).toEqual([TEAM_ACCESS_LOG.REVOKE_FAILED]);
    expect(logger.error).toHaveBeenCalledWith(
      TEAM_ACCESS_LOG.REVOKE_FAILED,
      expect.objectContaining({ cause: WORKER_LOG.ENQUEUE_SKIPPED }),
    );
  });
});
