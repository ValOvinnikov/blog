import type { TMaybeUndefined } from '@blog/config/types';
import {
  NEWSLETTER_POST_STATE,
  NEWSLETTER_SEND_GATE,
  NEWSLETTER_SEND_PACE,
  NEWSLETTER_SEND_PAGE_SIZE,
  NEWSLETTER_SLOW_PAUSE_MS,
  NEWSLETTER_SLOW_SENDS_PER_HOUR,
} from '@worker/constants/newsletter-send';
import { checkNewsletterPost } from '@worker/units/newsletter-send/check-newsletter-post';
import { gateNewsletterSend } from '@worker/units/newsletter-send/gate-newsletter-send';
import { sendNewsletterPage } from '@worker/units/newsletter-send/send-newsletter-page';
import {
  completeNewsletterSend,
  releaseNewsletterSendClaim,
} from '@worker/units/newsletter-send/settle-newsletter-send';
import { sleep } from 'workflow';

export async function sendNewsletterPost(
  tenantId: string,
  postId: string,
  claimedAt: string,
): Promise<void> {
  'use workflow';

  let check = await checkNewsletterPost(tenantId, postId);
  while (check.state === NEWSLETTER_POST_STATE.SCHEDULED) {
    await sleep(check.waitMs);
    check = await checkNewsletterPost(tenantId, postId);
  }
  if (check.state === NEWSLETTER_POST_STATE.CANCELLED) {
    await releaseNewsletterSendClaim(tenantId, postId, claimedAt);
    return;
  }
  const gate = await gateNewsletterSend(tenantId, postId);
  if (gate.gate === NEWSLETTER_SEND_GATE.NOT_CONFIGURED) {
    await releaseNewsletterSendClaim(tenantId, postId, claimedAt);
    return;
  }
  if (gate.gate === NEWSLETTER_SEND_GATE.SKIPPED) return;

  const { post } = check;
  let { pace } = gate;
  let afterId: TMaybeUndefined<string>;
  for (;;) {
    const isSlow = pace === NEWSLETTER_SEND_PACE.SLOW;
    const page = await sendNewsletterPage({
      tenantId,
      postId,
      post,
      afterId,
      pageSize: isSlow
        ? NEWSLETTER_SLOW_SENDS_PER_HOUR
        : NEWSLETTER_SEND_PAGE_SIZE,
    });
    if (page.pace === NEWSLETTER_SEND_PACE.STOPPED) return;
    if (page.isLastPage) break;

    ({ pace, lastId: afterId } = page);
    if (pace === NEWSLETTER_SEND_PACE.SLOW)
      await sleep(NEWSLETTER_SLOW_PAUSE_MS);
  }
  await completeNewsletterSend(tenantId, postId);
}
