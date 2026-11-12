import { ACTION_OUTCOME } from '@blog/config';
import type { TClearNewsletterPauseResult } from '@platform/server/newsletter-pause/clear-newsletter-pause-action';

export const clearNewsletterPauseAction = vi.fn<
  (tenantId: string) => Promise<TClearNewsletterPauseResult>
>(async () => ({ outcome: ACTION_OUTCOME.SUCCESS }));
