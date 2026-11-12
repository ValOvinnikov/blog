import type { TMaybeUndefined } from '@blog/config/types';
import {
  NEWSLETTER_POST_STATE,
  NEWSLETTER_SEND_GATE,
  NEWSLETTER_SEND_HOOK_PREFIX,
  NEWSLETTER_SEND_PACE,
  NEWSLETTER_SLOW_PAUSE_MS,
} from '@worker/constants/newsletter-send';
import { checkNewsletterPost } from '@worker/units/newsletter-send/check-newsletter-post';
import { gateNewsletterSend } from '@worker/units/newsletter-send/gate-newsletter-send';
import { sendNewsletterPage } from '@worker/units/newsletter-send/send-newsletter-page';
import {
  completeNewsletterSend,
  recordNewsletterSends,
  releaseNewsletterSendClaim,
  reportNewsletterSendFailed,
} from '@worker/units/newsletter-send/settle-newsletter-send';
import { createHook, sleep } from 'workflow';

async function runNewsletterSend(
  tenantId: string,
  postId: string,
  claimedAt: string,
): Promise<void> {
  let check = await checkNewsletterPost(tenantId, postId, claimedAt);
  while (check.state === NEWSLETTER_POST_STATE.SCHEDULED) {
    await sleep(check.waitMs);
    check = await checkNewsletterPost(tenantId, postId, claimedAt);
  }
  if (check.state === NEWSLETTER_POST_STATE.UNCLAIMED) return;
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
  let unreadableCount = 0;
  for (;;) {
    if (pace === NEWSLETTER_SEND_PACE.SLOW && afterId) {
      await sleep(NEWSLETTER_SLOW_PAUSE_MS);
    }
    const page = await sendNewsletterPage({ tenantId, postId, post, afterId });
    await recordNewsletterSends(tenantId, page.sentCount);
    if (page.pace === NEWSLETTER_SEND_PACE.STOPPED) return;

    unreadableCount += page.unreadableCount;
    if (page.isLastPage) break;
    ({ pace, lastId: afterId } = page);
  }
  await completeNewsletterSend(tenantId, postId, unreadableCount);
}

export async function sendNewsletterPost(
  tenantId: string,
  postId: string,
  claimedAt: string,
): Promise<void> {
  'use workflow';

  const run = createHook<null>({
    token: `${NEWSLETTER_SEND_HOOK_PREFIX}${tenantId}:${postId}:${claimedAt}`,
  });
  try {
    if (await run.getConflict()) return;
    await runNewsletterSend(tenantId, postId, claimedAt);
  } catch (error) {
    await reportNewsletterSendFailed(
      tenantId,
      postId,
      error instanceof Error ? error.message : String(error),
    );
    throw error;
  } finally {
    run.dispose();
  }
}
