import {
  NEWSLETTER_POST_STATE,
  NEWSLETTER_SCHEDULE_RECHECK_MS,
  NEWSLETTER_SEND_GATE,
  NEWSLETTER_SEND_PACE,
  NEWSLETTER_SEND_PAGE_SIZE,
  NEWSLETTER_SLOW_PAUSE_MS,
  NEWSLETTER_SLOW_SENDS_PER_HOUR,
} from '@worker/constants/newsletter-send';
import {
  MOCK_CLAIMED_AT,
  MOCK_NEWSLETTER_POST,
  MOCK_POST_ID,
  MOCK_SUBSCRIBER_IDS,
  mockNewsletterPage,
} from '@worker/testing/newsletter-send/fixtures';
import { MOCK_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { checkNewsletterPost } from '@worker/units/newsletter-send/check-newsletter-post';
import { gateNewsletterSend } from '@worker/units/newsletter-send/gate-newsletter-send';
import { sendNewsletterPage } from '@worker/units/newsletter-send/send-newsletter-page';
import {
  completeNewsletterSend,
  releaseNewsletterSendClaim,
} from '@worker/units/newsletter-send/settle-newsletter-send';
import { sleep } from 'workflow';

import { sendNewsletterPost } from './send-newsletter-post';

vi.mock('@worker/units/newsletter-send/check-newsletter-post');
vi.mock('@worker/units/newsletter-send/gate-newsletter-send');
vi.mock('@worker/units/newsletter-send/send-newsletter-page');
vi.mock('@worker/units/newsletter-send/settle-newsletter-send');
vi.mock('workflow');

const READY = {
  state: NEWSLETTER_POST_STATE.READY,
  post: MOCK_NEWSLETTER_POST,
} as const;
const [FIRST_ID] = MOCK_SUBSCRIBER_IDS;

function runSend() {
  return sendNewsletterPost(MOCK_TENANT_ID, MOCK_POST_ID, MOCK_CLAIMED_AT);
}

describe(sendNewsletterPost, () => {
  beforeEach(() => {
    vi.mocked(checkNewsletterPost).mockResolvedValue(READY);
    vi.mocked(gateNewsletterSend).mockResolvedValue({
      gate: NEWSLETTER_SEND_GATE.SEND,
      pace: NEWSLETTER_SEND_PACE.NORMAL,
    });
    vi.mocked(sendNewsletterPage).mockResolvedValue(mockNewsletterPage());
    vi.mocked(sleep).mockResolvedValue(undefined);
  });

  it('pages on from where the last page ended, then records the post as sent', async () => {
    vi.mocked(sendNewsletterPage).mockResolvedValueOnce(
      mockNewsletterPage({ lastId: FIRST_ID, isLastPage: false }),
    );

    await runSend();

    expect(
      vi.mocked(sendNewsletterPage).mock.calls.map(([page]) => page.afterId),
    ).toEqual([undefined, FIRST_ID]);
    expect(completeNewsletterSend).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_POST_ID,
    );
    expect(sleep).not.toHaveBeenCalled();
  });

  it('sleeps until a scheduled post is due and checks it again before sending', async () => {
    vi.mocked(checkNewsletterPost)
      .mockResolvedValueOnce({
        state: NEWSLETTER_POST_STATE.SCHEDULED,
        waitMs: NEWSLETTER_SCHEDULE_RECHECK_MS,
      })
      .mockResolvedValueOnce(READY);

    await runSend();

    expect(sleep).toHaveBeenCalledWith(NEWSLETTER_SCHEDULE_RECHECK_MS);
    expect(checkNewsletterPost).toHaveBeenCalledTimes(2);
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
    expect(gateNewsletterSend).not.toHaveBeenCalled();
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
      .mockResolvedValueOnce(
        mockNewsletterPage({ lastId: FIRST_ID, isLastPage: false }),
      )
      .mockResolvedValueOnce(
        mockNewsletterPage({ pace: NEWSLETTER_SEND_PACE.STOPPED }),
      );

    await runSend();

    expect(sendNewsletterPage).toHaveBeenCalledTimes(2);
    expect(completeNewsletterSend).not.toHaveBeenCalled();
  });

  it('sends a small page an hour while the site is slowed', async () => {
    vi.mocked(gateNewsletterSend).mockResolvedValue({
      gate: NEWSLETTER_SEND_GATE.SEND,
      pace: NEWSLETTER_SEND_PACE.SLOW,
    });
    vi.mocked(sendNewsletterPage)
      .mockResolvedValueOnce(
        mockNewsletterPage({
          pace: NEWSLETTER_SEND_PACE.SLOW,
          lastId: FIRST_ID,
          isLastPage: false,
        }),
      )
      .mockResolvedValueOnce(mockNewsletterPage());

    await runSend();

    expect(
      vi.mocked(sendNewsletterPage).mock.calls.map(([page]) => page.pageSize),
    ).toEqual([NEWSLETTER_SLOW_SENDS_PER_HOUR, NEWSLETTER_SLOW_SENDS_PER_HOUR]);
    expect(sleep).toHaveBeenCalledWith(NEWSLETTER_SLOW_PAUSE_MS);
  });

  it('returns to full pages once the site is no longer slowed', async () => {
    vi.mocked(sendNewsletterPage)
      .mockResolvedValueOnce(
        mockNewsletterPage({ lastId: FIRST_ID, isLastPage: false }),
      )
      .mockResolvedValueOnce(mockNewsletterPage());

    await runSend();

    expect(
      vi.mocked(sendNewsletterPage).mock.calls.map(([page]) => page.pageSize),
    ).toEqual([NEWSLETTER_SEND_PAGE_SIZE, NEWSLETTER_SEND_PAGE_SIZE]);
  });
});
