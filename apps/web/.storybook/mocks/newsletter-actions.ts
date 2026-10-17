import { ACTION_OUTCOME } from '@blog/config';
import type { TSubscribeResult } from '@web/server/newsletter/newsletter-actions/newsletter-actions';

/** Answers `SERVER_ERROR` for an address containing `fail`, `SUCCESS` otherwise. */
export const subscribeToNewsletterAction = async (
  email: string,
): Promise<TSubscribeResult> => {
  await new Promise((resolve) => setTimeout(resolve, 400));

  if (email.includes('fail')) {
    return { outcome: ACTION_OUTCOME.SERVER_ERROR };
  }

  return { outcome: ACTION_OUTCOME.SUCCESS };
};
