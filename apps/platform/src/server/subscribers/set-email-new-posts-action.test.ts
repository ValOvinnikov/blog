import { SUBSCRIBERS_LOG } from '@platform/constants/subscribers';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { ACTION_OUTCOME } from '@shinefold/config';

import { setEmailNewPostsAction } from './set-email-new-posts-action';

const { upsertEmailConfigMock } = vi.hoisted(() => ({
  upsertEmailConfigMock: vi.fn(),
}));

vi.mock('@platform/server/subscribers/require-subscribers-manager');

vi.mock('@shinefold/db', async () => ({
  ...(await mockDbConstants()),
  queries: { emailConfig: { upsertEmailConfig: upsertEmailConfigMock } },
}));

describe(setEmailNewPostsAction, () => {
  beforeEach(() => {
    upsertEmailConfigMock.mockReset().mockResolvedValue(undefined);
  });

  it.each([true, false])('stores the sending setting as %s', async (isOn) => {
    const result = await setEmailNewPostsAction(MOCK_TENANT_ID, isOn);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(upsertEmailConfigMock).toHaveBeenCalledExactlyOnceWith(
      MOCK_TENANT_ID,
      { emailNewPosts: isOn },
    );
  });

  it('logs a failed save and reports a server error', async () => {
    upsertEmailConfigMock.mockRejectedValue(new Error());

    const result = await setEmailNewPostsAction(MOCK_TENANT_ID, false);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(logger.error).toHaveBeenCalledExactlyOnceWith(
      SUBSCRIBERS_LOG.SENDING_SAVE_FAILED,
      expect.objectContaining({ tenantId: MOCK_TENANT_ID }),
    );
  });
});
