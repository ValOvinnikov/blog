/**
 * @vitest-environment jsdom
 */
import { faker } from '@faker-js/faker';
import {
  NEWSLETTER_SEND_STATUS,
  routes,
  type TNewsletterPostSendStatus,
} from '@shinefold/config';
import { MOCK_FETCH_ERROR } from '@shinefold/studio/testing/mock-fetch-error';
import {
  MOCK_RECIPIENTS,
  MOCK_SEND_DATE,
  mockNewsletterPostSendStatus,
} from '@shinefold/studio/testing/newsletter-post-send-status';
import { act, renderHook, waitFor } from '@testing-library/react';

import {
  CLAIM_CHECKS_AFTER_PUBLISH,
  SEND_STATUS_REFRESH_MS,
  useNewsletterPostSendStatus,
} from './use-newsletter-post-send-status';

faker.seed(7711);

const MOCK_POST = {
  projectId: faker.string.alphanumeric(8),
  postId: faker.string.uuid(),
  isPublished: true,
};
const MOCK_REVISION = faker.string.alphanumeric(12);
const MOCK_SENDING = mockNewsletterPostSendStatus({
  status: NEWSLETTER_SEND_STATUS.SENDING,
});
const MOCK_SENT = mockNewsletterPostSendStatus({
  status: NEWSLETTER_SEND_STATUS.SENT,
  recipients: MOCK_RECIPIENTS,
  settledAt: MOCK_SEND_DATE,
});
const MOCK_NO_CLAIM = mockNewsletterPostSendStatus();

const fetchMock = vi.fn<typeof fetch>();

const respondWith = (status: TNewsletterPostSendStatus) => {
  fetchMock.mockImplementation(async () => Response.json(status));
};

const statusReads = () =>
  fetchMock.mock.calls.filter(([input]) =>
    String(input).startsWith(routes.newsletterPostSendStatus()),
  ).length;

const advanceOneRefresh = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(SEND_STATUS_REFRESH_MS);
  });
};

const renderStatus = (revision?: string) =>
  renderHook(
    ({ publishedRevision }) =>
      useNewsletterPostSendStatus(MOCK_POST, publishedRevision),
    { initialProps: { publishedRevision: revision } },
  );

afterEach(() => {
  vi.useRealTimers();
});

describe(useNewsletterPostSendStatus, () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal('fetch', fetchMock);
  });

  describe('while the post is sending', () => {
    let result: ReturnType<typeof renderStatus>['result'];

    beforeEach(async () => {
      respondWith(MOCK_SENDING);
      ({ result } = renderStatus(MOCK_REVISION));
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('re-reads its status every ten seconds', async () => {
      const readsBefore = statusReads();

      await advanceOneRefresh();

      expect(statusReads()).toBe(readsBefore + 1);
    });

    it('stops re-reading once the status settles', async () => {
      respondWith(MOCK_SENT);
      await advanceOneRefresh();
      const readsAfterSettling = statusReads();

      await advanceOneRefresh();

      expect(result.current.status).toEqual(MOCK_SENT);
      expect(statusReads()).toBe(readsAfterSettling);
    });

    it('keeps the last status and keeps re-reading after a failed read', async () => {
      fetchMock.mockRejectedValueOnce(MOCK_FETCH_ERROR);
      await advanceOneRefresh();
      const readsAfterFailure = statusReads();

      await advanceOneRefresh();

      expect(result.current.status).toEqual(MOCK_SENDING);
      expect(statusReads()).toBe(readsAfterFailure + 1);
    });
  });

  describe('with a published post that has no claim', () => {
    let hook: ReturnType<typeof renderStatus>;

    beforeEach(async () => {
      respondWith(MOCK_NO_CLAIM);
      hook = renderStatus(MOCK_REVISION);
      await waitFor(() => {
        expect(hook.result.current.isLoading).toBe(false);
      });
    });

    it('does not wait for a claim when the post was published before', () => {
      expect(hook.result.current.isAwaitingClaim).toBe(false);
    });

    it('waits for the claim for a bounded time after a publish', async () => {
      hook.rerender({ publishedRevision: faker.string.alphanumeric(12) });
      await waitFor(() => {
        expect(hook.result.current.isAwaitingClaim).toBe(true);
      });

      for (let check = 0; check < CLAIM_CHECKS_AFTER_PUBLISH; check += 1) {
        await advanceOneRefresh();
      }

      expect(hook.result.current.isAwaitingClaim).toBe(false);
    });
  });
});
