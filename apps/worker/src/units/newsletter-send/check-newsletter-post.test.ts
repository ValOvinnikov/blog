import {
  ERROR_CODE,
  NEWSLETTER_SKIP_REASON,
} from '@shinefold/config/constants';
import { NEWSLETTER_POST_SEND_OUTCOME } from '@shinefold/db/constants';
import {
  getNewsletterPostSend,
  getNewsletterSendingOffCause,
  markNewsletterPostSkipped,
  releaseNewsletterPostSend,
  setNewsletterPostSendSchedule,
} from '@shinefold/db/queries/newsletter-post-sends';
import { getTenantSanityCredentials } from '@shinefold/db/queries/tenants';
import { mockNewsletterPostSend } from '@shinefold/db/testing/newsletter-post-sends/fixtures';
import { errorResult, okResult } from '@shinefold/utils/result';
import { NEWSLETTER_POST_STATE } from '@worker/constants/newsletter-send';
import { SCHEDULED_POST_RECHECK_MS } from '@worker/constants/workflow';
import { MOCK_ONE_HOUR_MS } from '@worker/testing/clock/frozen-clock';
import {
  MOCK_CLAIMED_AT,
  MOCK_NEWSLETTER_POST,
} from '@worker/testing/newsletter-send/fixtures';
import { MOCK_POST_ID } from '@worker/testing/post/fixtures';
import {
  MOCK_SANITY_CREDENTIALS,
  MOCK_TENANT_ID,
} from '@worker/testing/tenant/fixtures';
import { readNewsletterPost } from '@worker/utils/newsletter-send/read-newsletter-post';

import { checkNewsletterPost } from './check-newsletter-post';

vi.mock('@shinefold/db/queries/newsletter-post-sends');
vi.mock('@shinefold/db/queries/tenants');
vi.mock('@worker/utils/newsletter-send/read-newsletter-post');

const MOCK_NOW = new Date('2031-05-15T12:00:00Z');
const MOCK_PUBLISH_DATE = new Date(MOCK_NOW.getTime() + MOCK_ONE_HOUR_MS);
const MOCK_CLAIMED_AT_DATE = new Date(MOCK_CLAIMED_AT);
const CANCELLED = { state: NEWSLETTER_POST_STATE.CANCELLED };

function runCheck() {
  return checkNewsletterPost(MOCK_TENANT_ID, MOCK_POST_ID, MOCK_CLAIMED_AT);
}

function arrangeClaim(overrides: Parameters<typeof mockNewsletterPostSend>[0]) {
  vi.mocked(getNewsletterPostSend).mockResolvedValue(
    mockNewsletterPostSend({ claimedAt: MOCK_CLAIMED_AT_DATE, ...overrides }),
  );
}

function arrangePublishedAt(publishedAt: Date) {
  vi.mocked(readNewsletterPost).mockResolvedValue({
    ...MOCK_NEWSLETTER_POST,
    publishedAt: publishedAt.toISOString(),
  });
}

describe(checkNewsletterPost, () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: MOCK_NOW, toFake: ['Date'] });
    vi.mocked(getNewsletterSendingOffCause).mockResolvedValue(
      okResult(undefined),
    );
    vi.mocked(getTenantSanityCredentials).mockResolvedValue(
      MOCK_SANITY_CREDENTIALS,
    );
    vi.mocked(readNewsletterPost).mockResolvedValue(MOCK_NEWSLETTER_POST);
    arrangeClaim({});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('is ready once a published post with its switch on is due', async () => {
    await expect(runCheck()).resolves.toEqual({
      state: NEWSLETTER_POST_STATE.READY,
      post: MOCK_NEWSLETTER_POST,
    });
    expect(readNewsletterPost).toHaveBeenCalledWith(
      MOCK_SANITY_CREDENTIALS,
      MOCK_POST_ID,
    );
    expect(setNewsletterPostSendSchedule).not.toHaveBeenCalled();
  });

  describe('for a post dated in the future', () => {
    beforeEach(() => {
      arrangePublishedAt(MOCK_PUBLISH_DATE);
    });

    it('waits until a post dated in the future is due, recording its date on the claim', async () => {
      await expect(runCheck()).resolves.toEqual({
        state: NEWSLETTER_POST_STATE.SCHEDULED,
        waitMs: MOCK_ONE_HOUR_MS,
      });
      expect(setNewsletterPostSendSchedule).toHaveBeenCalledExactlyOnceWith(
        MOCK_TENANT_ID,
        MOCK_POST_ID,
        MOCK_CLAIMED_AT_DATE,
        MOCK_PUBLISH_DATE,
      );
    });

    it('leaves the claim’s date alone while the post’s date is unchanged', async () => {
      arrangeClaim({ scheduledFor: MOCK_PUBLISH_DATE });

      await runCheck();

      expect(setNewsletterPostSendSchedule).not.toHaveBeenCalled();
    });

    it('follows the post’s date when the editor moves it', async () => {
      const movedTo = new Date(MOCK_PUBLISH_DATE.getTime() + MOCK_ONE_HOUR_MS);
      arrangePublishedAt(movedTo);
      arrangeClaim({ scheduledFor: MOCK_PUBLISH_DATE });

      await runCheck();

      expect(setNewsletterPostSendSchedule).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        MOCK_POST_ID,
        MOCK_CLAIMED_AT_DATE,
        movedTo,
      );
    });
  });

  it('checks a far-future post again within a day', async () => {
    arrangePublishedAt(
      new Date(MOCK_NOW.getTime() + 3 * SCHEDULED_POST_RECHECK_MS),
    );

    await expect(runCheck()).resolves.toEqual({
      state: NEWSLETTER_POST_STATE.SCHEDULED,
      waitMs: SCHEDULED_POST_RECHECK_MS,
    });
  });

  it('sends a post started by hand even though its own switch is off', async () => {
    const switchedOff = {
      ...MOCK_NEWSLETTER_POST,
      isSendToSubscribersOn: false,
    };
    vi.mocked(readNewsletterPost).mockResolvedValue(switchedOff);
    arrangeClaim({ handStartedAt: MOCK_CLAIMED_AT_DATE });

    await expect(runCheck()).resolves.toEqual({
      state: NEWSLETTER_POST_STATE.READY,
      post: switchedOff,
    });
  });

  it.each([
    ['unpublished', undefined],
    ['switched off', { ...MOCK_NEWSLETTER_POST, isSendToSubscribersOn: false }],
  ])('cancels a post that is %s', async (_, post) => {
    vi.mocked(readNewsletterPost).mockResolvedValue(post);

    await expect(runCheck()).resolves.toEqual(CANCELLED);
  });

  it('cancels a hand send whose post was unpublished', async () => {
    vi.mocked(readNewsletterPost).mockResolvedValue(undefined);
    arrangeClaim({ handStartedAt: MOCK_CLAIMED_AT_DATE });

    await expect(runCheck()).resolves.toEqual(CANCELLED);
  });

  it.each([
    NEWSLETTER_SKIP_REASON.NEWSLETTER_OFF,
    NEWSLETTER_SKIP_REASON.SENDING_OFF,
  ])('cancels the send without reading the post when %s', async (cause) => {
    vi.mocked(getNewsletterSendingOffCause).mockResolvedValue(okResult(cause));

    await expect(runCheck()).resolves.toEqual(CANCELLED);
    expect(readNewsletterPost).not.toHaveBeenCalled();
    expect(markNewsletterPostSkipped).not.toHaveBeenCalled();
  });

  it.each([
    NEWSLETTER_SKIP_REASON.NOT_IN_PLAN,
    NEWSLETTER_SKIP_REASON.SITE_INACTIVE,
  ])(
    'keeps the claim as skipped for %s, so a move back never emails it',
    async (cause) => {
      vi.mocked(getNewsletterSendingOffCause).mockResolvedValue(
        okResult(cause),
      );

      await expect(runCheck()).resolves.toEqual({
        state: NEWSLETTER_POST_STATE.SKIPPED,
      });
      expect(markNewsletterPostSkipped).toHaveBeenCalledExactlyOnceWith(
        MOCK_TENANT_ID,
        MOCK_POST_ID,
        cause,
      );
      expect(releaseNewsletterPostSend).not.toHaveBeenCalled();
      expect(readNewsletterPost).not.toHaveBeenCalled();
    },
  );

  it('cancels the send for an unknown site', async () => {
    vi.mocked(getNewsletterSendingOffCause).mockResolvedValue(
      errorResult(ERROR_CODE.DB_NOT_FOUND),
    );

    await expect(runCheck()).resolves.toEqual(CANCELLED);
  });

  it.each([
    ['no claim at all', undefined],
    [
      'a newer claim',
      mockNewsletterPostSend({
        claimedAt: new Date(MOCK_CLAIMED_AT_DATE.getTime() + MOCK_ONE_HOUR_MS),
      }),
    ],
    [
      'a claim that already has an outcome',
      mockNewsletterPostSend({
        claimedAt: MOCK_CLAIMED_AT_DATE,
        outcome: NEWSLETTER_POST_SEND_OUTCOME.SKIPPED,
      }),
    ],
  ])('ends a run started for %s, reading nothing else', async (_, claim) => {
    vi.mocked(getNewsletterPostSend).mockResolvedValue(claim);

    await expect(runCheck()).resolves.toEqual({
      state: NEWSLETTER_POST_STATE.UNCLAIMED,
    });
    expect(getNewsletterSendingOffCause).not.toHaveBeenCalled();
    expect(readNewsletterPost).not.toHaveBeenCalled();
  });
});
