import type { TClearNewsletterPauseResult } from '@platform/server/newsletter-pause/clear-newsletter-pause-action';
import { ACTION_OUTCOME } from '@shinefold/config';

export const clearNewsletterPauseAction = vi.fn<
  (tenantId: string) => Promise<TClearNewsletterPauseResult>
>(async () => ({ outcome: ACTION_OUTCOME.SUCCESS }));
