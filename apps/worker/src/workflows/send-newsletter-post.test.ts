import {
  NEWSLETTER_POST_STATE,
  NEWSLETTER_SEND_GATE,
  NEWSLETTER_SEND_PACE,
  NEWSLETTER_SLOW_PAUSE_MS,
} from '@worker/constants/newsletter-send';
import { SCHEDULED_POST_RECHECK_MS } from '@worker/constants/workflow';
import {
  MOCK_CLAIMED_AT,
  MOCK_NEWSLETTER_POST,
  MOCK_SUBSCRIBER_IDS,
  mockNewsletterPage,
} from '@worker/testing/newsletter-send/fixtures';
import { MOCK_WORKFLOW_CRASH } from '@worker/testing/outage/fixtures';
import { MOCK_POST_ID } from '@worker/testing/post/fixtures';
import { MOCK_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { fakeRunHook } from '@worker/testing/workflow/run-hook';
import { checkNewsletterPost } from '@worker/units/newsletter-send/check-newsletter-post';
import { gateNewsletterSend } from '@worker/units/newsletter-send/gate-newsletter-send';
import { sendNewsletterPage } from '@worker/units/newsletter-send/send-newsletter-page';
import {
  completeNewsletterSend,
  failNewsletterSend,
  recordNewsletterSends,
  releaseNewsletterSendClaim,
} from '@worker/units/newsletter-send/settle-newsletter-send';
import { sleep } from 'workflow';

import { sendNewsletterPost } from './send-newsletter-post';

vi.mock('@worker/units/newsletter-send/check-newsletter-post');
vi.mock('@worker/units/newsletter-send/gate-newsletter-send');
vi.mock('@worker/units/newsletter-send/send-newsletter-page');
vi.mock('@worker/units/newsletter-send/settle-newsletter-send');
vi.mock('workflow');

const MOCK_READY = {
  state: NEWSLETTER_POST_STATE.READY,
  post: MOCK_NEWSLETTER_POST,
} as const;
const [MOCK_FIRST_ID] = MOCK_SUBSCRIBER_IDS;
const MOCK_FIRST_PAGE = mockNewsletterPage({
  lastId: MOCK_FIRST_ID,
  isLastPage: false,
  unreadableCount: 2,
});

function runSend() {
  return sendNewsletterPost(MOCK_TENANT_ID, MOCK_POST_ID, MOCK_CLAIMED_AT);
}

describe(sendNewsletterPost, () => {
  let hook: ReturnType<typeof fakeRunHook>;

  beforeEach(() => {
    hook = fakeRunHook();
    vi.mocked(checkNewsletterPost).mockResolvedValue(MOCK_READY);
    vi.mocked(gateNewsletterSend).mockResolvedValue({
      gate: NEWSLETTER_SEND_GATE.SEND,
      pace: NEWSLETTER_SEND_PACE.NORMAL,
    });
    vi.mocked(sendNewsletterPage).mockResolvedValue(mockNewsletterPage());
    vi.mocked(sleep).mockResolvedValue(undefined);
  });

  describe('over two pages', () => {
    beforeEach(() => {
      vi.mocked(sendNewsletterPage).mockResolvedValueOnce(MOCK_FIRST_PAGE);
    });

    it('pages on from the last page’s place and total, then marks the post sent', async () => {
      await runSend();

      expect(
        vi.mocked(sendNewsletterPage).mock.calls.map(([page]) => page.afterId),
      ).toEqual([undefined, MOCK_FIRST_ID]);
      expect(
        vi
          .mocked(sendNewsletterPage)
          .mock.calls.map(([page]) => page.reachedBefore),
      ).toEqual([0, MOCK_FIRST_PAGE.reachedCount]);
      expect(completeNewsletterSend).toHaveBeenCalled();
      expect(sleep).not.toHaveBeenCalled();
      expect(hook.dispose).toHaveBeenCalled();
    });

    it('carries the unreadable addresses of every page to the end of the run', async () => {
      vi.mocked(sendNewsletterPage).mockResolvedValueOnce(
        mockNewsletterPage({ unreadableCount: 1 }),
      );

      await runSend();

      expect(completeNewsletterSend).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        MOCK_POST_ID,
        MOCK_FIRST_PAGE.unreadableCount + 1,
      );
    });

    it('ends without recording a send when the gate stops it partway', async () => {
      vi.mocked(sendNewsletterPage).mockResolvedValueOnce(
        mockNewsletterPage({ pace: NEWSLETTER_SEND_PACE.STOPPED }),
      );

      await runSend();

      expect(sendNewsletterPage).toHaveBeenCalledTimes(2);
      expect(completeNewsletterSend).not.toHaveBeenCalled();
    });
  });

  it('ends at once when another run already holds this claim', async () => {
    hook = fakeRunHook(true);

    await runSend();

    expect(checkNewsletterPost).not.toHaveBeenCalled();
    expect(hook.dispose).toHaveBeenCalled();
  });

  it.each([
    ['the claim is no longer this run’s', NEWSLETTER_POST_STATE.UNCLAIMED],
    ['the check recorded the claim as skipped', NEWSLETTER_POST_STATE.SKIPPED],
  ] as const)('ends without releasing anything when %s', async (_, state) => {
    vi.mocked(checkNewsletterPost).mockResolvedValue({ state });

    await runSend();

    expect(releaseNewsletterSendClaim).not.toHaveBeenCalled();
    expect(gateNewsletterSend).not.toHaveBeenCalled();
  });

  it('sleeps until a scheduled post is due and checks it again before sending', async () => {
    vi.mocked(checkNewsletterPost)
      .mockResolvedValueOnce({
        state: NEWSLETTER_POST_STATE.SCHEDULED,
        waitMs: SCHEDULED_POST_RECHECK_MS,
      })
      .mockResolvedValueOnce(MOCK_READY);

    await runSend();

    expect(sleep).toHaveBeenCalledWith(SCHEDULED_POST_RECHECK_MS);
    expect(checkNewsletterPost).toHaveBeenNthCalledWith(
      2,
      MOCK_TENANT_ID,
      MOCK_POST_ID,
      MOCK_CLAIMED_AT,
    );
    expect(completeNewsletterSend).toHaveBeenCalled();
  });

  describe('when the post can no longer be sent', () => {
    beforeEach(() => {
      vi.mocked(checkNewsletterPost).mockResolvedValue({
        state: NEWSLETTER_POST_STATE.CANCELLED,
      });
    });

    it('gives the claim back and sends nothing', async () => {
      await runSend();

      expect(releaseNewsletterSendClaim).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        MOCK_POST_ID,
        MOCK_CLAIMED_AT,
      );
      expect(sendNewsletterPage).not.toHaveBeenCalled();
    });

    it('settles as failed when giving the claim back runs out of retries', async () => {
      vi.mocked(releaseNewsletterSendClaim).mockRejectedValue(
        new Error(MOCK_WORKFLOW_CRASH),
      );

      await expect(runSend()).rejects.toThrow(MOCK_WORKFLOW_CRASH);
      expect(failNewsletterSend).toHaveBeenCalledExactlyOnceWith(
        MOCK_TENANT_ID,
        MOCK_POST_ID,
        MOCK_WORKFLOW_CRASH,
      );
    });
  });

  it('gives the claim back when tenant mail is not configured', async () => {
    vi.mocked(gateNewsletterSend).mockResolvedValue({
      gate: NEWSLETTER_SEND_GATE.NOT_CONFIGURED,
    });

    await runSend();

    expect(releaseNewsletterSendClaim).toHaveBeenCalled();
    expect(sendNewsletterPage).not.toHaveBeenCalled();
  });

  it('keeps a skipped claim and sends nothing', async () => {
    vi.mocked(gateNewsletterSend).mockResolvedValue({
      gate: NEWSLETTER_SEND_GATE.SKIPPED,
    });

    await runSend();

    expect(sendNewsletterPage).not.toHaveBeenCalled();
    expect(releaseNewsletterSendClaim).not.toHaveBeenCalled();
    expect(completeNewsletterSend).not.toHaveBeenCalled();
  });

  it('waits an hour between pages while the site is slowed', async () => {
    vi.mocked(sendNewsletterPage)
      .mockResolvedValueOnce({
        ...MOCK_FIRST_PAGE,
        pace: NEWSLETTER_SEND_PACE.SLOW,
      })
      .mockResolvedValueOnce(mockNewsletterPage());

    await runSend();

    expect(sleep).toHaveBeenCalledExactlyOnceWith(NEWSLETTER_SLOW_PAUSE_MS);
  });

  it('settles a run that fails for good as failed', async () => {
    vi.mocked(sendNewsletterPage).mockRejectedValue(
      new Error(MOCK_WORKFLOW_CRASH),
    );

    await expect(runSend()).rejects.toThrow(MOCK_WORKFLOW_CRASH);
    expect(failNewsletterSend).toHaveBeenCalledExactlyOnceWith(
      MOCK_TENANT_ID,
      MOCK_POST_ID,
      MOCK_WORKFLOW_CRASH,
    );
    expect(releaseNewsletterSendClaim).not.toHaveBeenCalled();
    expect(completeNewsletterSend).not.toHaveBeenCalled();
    expect(hook.dispose).toHaveBeenCalled();
  });

  it.each([
    ['the post check', () => vi.mocked(checkNewsletterPost)],
    ['the gate', () => vi.mocked(gateNewsletterSend)],
  ])(
    'settles a run that fails for good at %s as failed, before any email',
    async (_, step) => {
      step().mockRejectedValue(new Error(MOCK_WORKFLOW_CRASH));

      await expect(runSend()).rejects.toThrow(MOCK_WORKFLOW_CRASH);
      expect(failNewsletterSend).toHaveBeenCalledExactlyOnceWith(
        MOCK_TENANT_ID,
        MOCK_POST_ID,
        MOCK_WORKFLOW_CRASH,
      );
      expect(sendNewsletterPage).not.toHaveBeenCalled();
      expect(releaseNewsletterSendClaim).not.toHaveBeenCalled();
    },
  );

  describe('a one-page send', () => {
    beforeEach(async () => {
      await runSend();
    });

    it('counts each page’s sends in its own step', async () => {
      expect(recordNewsletterSends).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        MOCK_SUBSCRIBER_IDS.length,
      );
    });

    it('hands the gate and each page the post the check read, under this run’s claim', async () => {
      const claim = {
        tenantId: MOCK_TENANT_ID,
        postId: MOCK_POST_ID,
        claimedAt: MOCK_CLAIMED_AT,
        post: MOCK_NEWSLETTER_POST,
      };
      expect(gateNewsletterSend).toHaveBeenCalledExactlyOnceWith(claim);
      expect(sendNewsletterPage).toHaveBeenCalledExactlyOnceWith({
        ...claim,
        afterId: undefined,
        reachedBefore: 0,
      });
    });
  });
});
