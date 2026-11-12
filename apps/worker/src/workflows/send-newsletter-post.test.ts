import {
  NEWSLETTER_POST_STATE,
  NEWSLETTER_SCHEDULE_RECHECK_MS,
  NEWSLETTER_SEND_GATE,
  NEWSLETTER_SEND_PACE,
  NEWSLETTER_SLOW_PAUSE_MS,
} from '@worker/constants/newsletter-send';
import {
  MOCK_CLAIMED_AT,
  MOCK_NEWSLETTER_POST,
  MOCK_POST_ID,
  MOCK_SUBSCRIBER_IDS,
  mockNewsletterPage,
} from '@worker/testing/newsletter-send/fixtures';
import { MOCK_WORKFLOW_CRASH } from '@worker/testing/outage/fixtures';
import { MOCK_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { checkNewsletterPost } from '@worker/units/newsletter-send/check-newsletter-post';
import { gateNewsletterSend } from '@worker/units/newsletter-send/gate-newsletter-send';
import { sendNewsletterPage } from '@worker/units/newsletter-send/send-newsletter-page';
import {
  completeNewsletterSend,
  recordNewsletterSends,
  releaseNewsletterSendClaim,
  reportNewsletterSendFailed,
} from '@worker/units/newsletter-send/settle-newsletter-send';
import { createHook, type Hook, sleep } from 'workflow';

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
const MOCK_MORE_TO_COME = mockNewsletterPage({
  lastId: MOCK_FIRST_ID,
  isLastPage: false,
});

function fakeRunHook(hasConflict = false) {
  const hook = {
    getConflict: vi.fn(async () => (hasConflict ? ({} as never) : null)),
    dispose: vi.fn(),
  };
  vi.mocked(createHook).mockReturnValue(hook as unknown as Hook<null>);
  return hook;
}

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

  it('pages on from where the last page ended, then records the post as sent', async () => {
    vi.mocked(sendNewsletterPage).mockResolvedValueOnce(MOCK_MORE_TO_COME);

    await runSend();

    expect(
      vi.mocked(sendNewsletterPage).mock.calls.map(([page]) => page.afterId),
    ).toEqual([undefined, MOCK_FIRST_ID]);
    expect(completeNewsletterSend).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_POST_ID,
      0,
    );
    expect(sleep).not.toHaveBeenCalled();
    expect(hook.dispose).toHaveBeenCalled();
  });

  it('counts each page’s sends in its own step', async () => {
    await runSend();

    expect(recordNewsletterSends).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_SUBSCRIBER_IDS.length,
    );
  });

  it('carries the unreadable addresses of every page to the end of the run', async () => {
    vi.mocked(sendNewsletterPage)
      .mockResolvedValueOnce({ ...MOCK_MORE_TO_COME, unreadableCount: 2 })
      .mockResolvedValueOnce(mockNewsletterPage({ unreadableCount: 1 }));

    await runSend();

    expect(completeNewsletterSend).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_POST_ID,
      3,
    );
  });

  it('ends at once when another run already holds this claim', async () => {
    hook = fakeRunHook(true);

    await runSend();

    expect(checkNewsletterPost).not.toHaveBeenCalled();
    expect(hook.dispose).toHaveBeenCalled();
  });

  it('ends without releasing anything when the claim is no longer this run’s', async () => {
    vi.mocked(checkNewsletterPost).mockResolvedValue({
      state: NEWSLETTER_POST_STATE.UNCLAIMED,
    });

    await runSend();

    expect(releaseNewsletterSendClaim).not.toHaveBeenCalled();
    expect(gateNewsletterSend).not.toHaveBeenCalled();
  });

  it('sleeps until a scheduled post is due and checks it again before sending', async () => {
    vi.mocked(checkNewsletterPost)
      .mockResolvedValueOnce({
        state: NEWSLETTER_POST_STATE.SCHEDULED,
        waitMs: NEWSLETTER_SCHEDULE_RECHECK_MS,
      })
      .mockResolvedValueOnce(MOCK_READY);

    await runSend();

    expect(sleep).toHaveBeenCalledWith(NEWSLETTER_SCHEDULE_RECHECK_MS);
    expect(checkNewsletterPost).toHaveBeenNthCalledWith(
      2,
      MOCK_TENANT_ID,
      MOCK_POST_ID,
      MOCK_CLAIMED_AT,
    );
    expect(completeNewsletterSend).toHaveBeenCalled();
  });

  it('gives the claim back and sends nothing when the post can no longer be sent', async () => {
    vi.mocked(checkNewsletterPost).mockResolvedValue({
      state: NEWSLETTER_POST_STATE.CANCELLED,
    });

    await runSend();

    expect(releaseNewsletterSendClaim).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_POST_ID,
      MOCK_CLAIMED_AT,
    );
    expect(sendNewsletterPage).not.toHaveBeenCalled();
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

  it('ends without recording a send when the gate stops it partway', async () => {
    vi.mocked(sendNewsletterPage)
      .mockResolvedValueOnce(MOCK_MORE_TO_COME)
      .mockResolvedValueOnce(
        mockNewsletterPage({ pace: NEWSLETTER_SEND_PACE.STOPPED }),
      );

    await runSend();

    expect(sendNewsletterPage).toHaveBeenCalledTimes(2);
    expect(completeNewsletterSend).not.toHaveBeenCalled();
  });

  it('waits an hour between pages while the site is slowed', async () => {
    vi.mocked(sendNewsletterPage)
      .mockResolvedValueOnce({
        ...MOCK_MORE_TO_COME,
        pace: NEWSLETTER_SEND_PACE.SLOW,
      })
      .mockResolvedValueOnce(mockNewsletterPage());

    await runSend();

    expect(sleep).toHaveBeenCalledExactlyOnceWith(NEWSLETTER_SLOW_PAUSE_MS);
  });

  it('reports a run that fails for good, leaving its claim unsettled', async () => {
    vi.mocked(sendNewsletterPage).mockRejectedValue(
      new Error(MOCK_WORKFLOW_CRASH),
    );

    await expect(runSend()).rejects.toThrow(MOCK_WORKFLOW_CRASH);
    expect(reportNewsletterSendFailed).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_POST_ID,
      MOCK_WORKFLOW_CRASH,
    );
    expect(releaseNewsletterSendClaim).not.toHaveBeenCalled();
    expect(completeNewsletterSend).not.toHaveBeenCalled();
    expect(hook.dispose).toHaveBeenCalled();
  });
});
