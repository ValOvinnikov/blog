import 'server-only';

import Stripe from 'stripe';

export const hasScheduleEnded = async (
  stripe: Stripe,
  scheduleId: string,
): Promise<boolean> => {
  const { released_at, canceled_at, completed_at } =
    await stripe.subscriptionSchedules.retrieve(scheduleId);
  return Boolean(released_at || canceled_at || completed_at);
};

export const releaseSchedule = async (
  stripe: Stripe,
  scheduleId: string,
): Promise<void> => {
  try {
    await stripe.subscriptionSchedules.release(scheduleId);
  } catch (error) {
    if (!(error instanceof Stripe.errors.StripeInvalidRequestError))
      throw error;
    if (!(await hasScheduleEnded(stripe, scheduleId))) throw error;
  }
};
