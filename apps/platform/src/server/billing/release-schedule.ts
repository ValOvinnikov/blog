import 'server-only';

import Stripe from 'stripe';

export const releaseSchedule = async (
  stripe: Stripe,
  scheduleId: string,
): Promise<void> => {
  try {
    await stripe.subscriptionSchedules.release(scheduleId);
  } catch (error) {
    if (!(error instanceof Stripe.errors.StripeInvalidRequestError))
      throw error;
    const { released_at, canceled_at, completed_at } =
      await stripe.subscriptionSchedules.retrieve(scheduleId);
    if (!released_at && !canceled_at && !completed_at) throw error;
  }
};
