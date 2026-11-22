'use server';

import {
  SUBSCRIBERS_LOG,
  SUBSCRIBERS_REFUSAL,
} from '@platform/constants/subscribers';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import {
  ACTION_OUTCOME,
  SUBSCRIBER_OUTCOME,
  type TActionResult,
} from '@shinefold/config';
import { queries } from '@shinefold/db';
import { toOutcome } from '@shinefold/utils/to-outcome';
import { z } from 'zod';

import { requireSubscribersManager } from './require-subscribers-manager';

const subscriberIdSchema = z.uuid();

export type TRemoveSubscriberResult = TActionResult<
  typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
  never,
  never,
  typeof SUBSCRIBERS_REFUSAL.NOT_FOUND
>;

const NOT_FOUND = {
  outcome: ACTION_OUTCOME.REFUSED,
  reason: SUBSCRIBERS_REFUSAL.NOT_FOUND,
} as const;

export const removeSubscriberAction = async (
  tenantId: string,
  subscriberId: string,
): Promise<TRemoveSubscriberResult> => {
  const { tenant } = await requireSubscribersManager(tenantId);

  const parsed = subscriberIdSchema.safeParse(subscriberId);
  if (!parsed.success) return NOT_FOUND;

  try {
    const { outcome } = await queries.subscribers.unsubscribeById(
      tenant.id,
      parsed.data,
    );
    if (outcome === SUBSCRIBER_OUTCOME.NOT_FOUND) return NOT_FOUND;
  } catch (error) {
    logger.error(SUBSCRIBERS_LOG.REMOVE_FAILED, {
      tenantId: tenant.id,
      ...toLoggableError(error),
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }

  return toOutcome(ACTION_OUTCOME.SUCCESS);
};
