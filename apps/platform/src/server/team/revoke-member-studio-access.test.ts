import {
  MEMBER_ACCESS_PATH,
  TEAM_ACCESS_LOG,
} from '@platform/constants/team-access';
import { enqueueWorkerRequest } from '@platform/server/provisioning/enqueue-provisioning';
import {
  MOCK_MEMBER_EMAIL,
  MOCK_SANITY_USER_ID,
} from '@platform/testing/team/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { HTTP_STATUS } from '@shinefold/config';

import { revokeMemberStudioAccess } from './revoke-member-studio-access';

vi.mock('@platform/server/provisioning/enqueue-provisioning');

const enqueue = vi.mocked(enqueueWorkerRequest);
const REMOVED = {
  memberEmail: MOCK_MEMBER_EMAIL,
  sanityUserId: MOCK_SANITY_USER_ID,
};

const revoke = async () => {
  const run = revokeMemberStudioAccess(MOCK_TENANT_ID, REMOVED);
  await vi.runAllTimersAsync();
  await run;
};

describe(revokeMemberStudioAccess, () => {
  beforeEach(() => {
    vi.useFakeTimers();
    enqueue.mockReset().mockResolvedValue(HTTP_STATUS.ACCEPTED);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("sends the removed member's address and Sanity user to the worker's revoke route", async () => {
    await revoke();

    expect(enqueue).toHaveBeenCalledExactlyOnceWith(MEMBER_ACCESS_PATH.REVOKE, {
      tenantId: MOCK_TENANT_ID,
      ...REMOVED,
    });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('retries a refused request and logs nothing once one is accepted', async () => {
    enqueue
      .mockResolvedValueOnce(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .mockResolvedValueOnce(null);

    await revoke();

    expect(enqueue).toHaveBeenCalledTimes(3);
    expect(logger.error).not.toHaveBeenCalled();
  });

  describe('when every attempt fails', () => {
    beforeEach(() => {
      enqueue.mockResolvedValue(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    });

    it('waits a second and then three before the retries', async () => {
      const run = revokeMemberStudioAccess(MOCK_TENANT_ID, REMOVED);
      await vi.advanceTimersByTimeAsync(999);
      expect(enqueue).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1);
      expect(enqueue).toHaveBeenCalledTimes(2);
      await vi.advanceTimersByTimeAsync(3000);
      await run;

      expect(enqueue).toHaveBeenCalledTimes(3);
    });

    it('logs once after the third failed attempt', async () => {
      await revoke();

      expect(enqueue).toHaveBeenCalledTimes(3);
      expect(logger.error).toHaveBeenCalledExactlyOnceWith(
        TEAM_ACCESS_LOG.REVOKE_FAILED,
        {
          tenantId: MOCK_TENANT_ID,
          responseStatus: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        },
      );
    });
  });
});
