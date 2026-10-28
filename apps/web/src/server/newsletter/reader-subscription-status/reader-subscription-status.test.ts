import { SUBSCRIBER_OUTCOME } from '@blog/config';
import { queries } from '@blog/db';
import { SUBSCRIBER_STATUS } from '@blog/db/constants';
import { toOutcome } from '@blog/utils/to-outcome';
import { getRequestTenantId } from '@web/server/tenant/request-tenant/request-tenant';
import { arrangeNoSessionOnce } from '@web/testing/shared/session/arrange-no-session-once';
import { MOCK_USER_ID } from '@web/testing/shared/session/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';

import { isReaderSubscribedToNewsletter } from './reader-subscription-status';

vi.mock('@web/server/auth/auth');

vi.mock('@web/server/tenant/request-tenant/request-tenant');

vi.mock('@blog/db', async () => ({
  ...(await import('@blog/db/constants')),
  queries: { subscribers: { getSubscriptionStatus: vi.fn() } },
}));

describe(isReaderSubscribedToNewsletter, () => {
  it.each([
    ['there is no session', arrangeNoSessionOnce],
    [
      'no tenant resolves',
      () => vi.mocked(getRequestTenantId).mockResolvedValueOnce(undefined),
    ],
  ])('answers false without querying the db when %s', async (_, arrange) => {
    arrange();

    const isSubscribed = await isReaderSubscribedToNewsletter();

    expect(isSubscribed).toBe(false);
    expect(queries.subscribers.getSubscriptionStatus).not.toHaveBeenCalled();
  });

  it.each([
    [SUBSCRIBER_STATUS.ACTIVE, true],
    [SUBSCRIBER_STATUS.PENDING, true],
    [SUBSCRIBER_OUTCOME.NOT_SUBSCRIBED, false],
  ])(
    "answers from the signed-in reader's own %s subscription",
    async (status, expected) => {
      vi.mocked(
        queries.subscribers.getSubscriptionStatus,
      ).mockResolvedValueOnce(toOutcome(status));

      const isSubscribed = await isReaderSubscribedToNewsletter();

      expect(isSubscribed).toBe(expected);
      expect(queries.subscribers.getSubscriptionStatus).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        MOCK_USER_ID,
      );
    },
  );
});
