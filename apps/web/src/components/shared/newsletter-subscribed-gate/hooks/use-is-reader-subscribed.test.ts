/**
 * @vitest-environment jsdom
 */
import type { TValueOf } from '@blog/config/utils';
import { NEWSLETTER_LOG } from '@web/constants/newsletter';
import { SESSION_STATUS } from '@web/constants/session';
import { isReaderSubscribedToNewsletter } from '@web/server/newsletter/reader-subscription-status/reader-subscription-status';
import { renderHook, waitFor } from '@web/testing/custom-render';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockSession } from '@web/testing/shared/session/fixtures';
import { reportClientError } from '@web/utils/report-client-error';
import { type SessionContextValue, useSession } from 'next-auth/react';

import { useIsReaderSubscribed } from './use-is-reader-subscribed';

vi.mock('next-auth/react', () => ({ useSession: vi.fn() }));

vi.mock(
  '@web/server/newsletter/reader-subscription-status/reader-subscription-status',
  () => ({ isReaderSubscribedToNewsletter: vi.fn() }),
);

vi.mock('@web/utils/report-client-error');

const mockSessionStatus = (status: TValueOf<typeof SESSION_STATUS>) => {
  vi.mocked(useSession).mockReturnValue({
    data: status === SESSION_STATUS.AUTHENTICATED ? mockSession() : null,
    status,
    update: vi.fn(),
  } as SessionContextValue);
};

describe(useIsReaderSubscribed, () => {
  it.each([SESSION_STATUS.UNAUTHENTICATED, SESSION_STATUS.LOADING])(
    'leaves the decision to the cookie while the session is %s',
    (status) => {
      mockSessionStatus(status);

      const { result } = renderHook(() => useIsReaderSubscribed());

      expect(result.current).toBeUndefined();
      expect(isReaderSubscribedToNewsletter).not.toHaveBeenCalled();
    },
  );

  it.each([true, false])(
    "answers %s from a signed-in reader's own subscription",
    async (isSubscribed) => {
      mockSessionStatus(SESSION_STATUS.AUTHENTICATED);
      vi.mocked(isReaderSubscribedToNewsletter).mockResolvedValue(isSubscribed);

      const { result } = renderHook(() => useIsReaderSubscribed());

      await waitFor(() => {
        expect(result.current).toBe(isSubscribed);
      });
    },
  );

  it('reports and leaves the decision to the cookie when the status read fails', async () => {
    mockSessionStatus(SESSION_STATUS.AUTHENTICATED);
    vi.mocked(isReaderSubscribedToNewsletter).mockRejectedValue(MOCK_ERROR);

    const { result } = renderHook(() => useIsReaderSubscribed());

    await waitFor(() => {
      expect(reportClientError).toHaveBeenCalledWith(
        NEWSLETTER_LOG.GATE_STATUS_FETCH_FAILED,
        MOCK_ERROR,
      );
    });
    expect(result.current).toBeUndefined();
  });
});
