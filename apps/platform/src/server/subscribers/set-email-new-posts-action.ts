'use server';

import { SUBSCRIBERS_LOG } from '@platform/constants/subscribers';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import { ACTION_OUTCOME, type TActionResult } from '@shinefold/config';
import { queries } from '@shinefold/db';
import { toOutcome } from '@shinefold/utils/to-outcome';
import { z } from 'zod';

import { requireSubscribersManager } from './require-subscribers-manager';

const emailNewPostsSchema = z.boolean();

export type TSetEmailNewPostsResult = TActionResult<
  typeof ACTION_OUTCOME.SERVER_ERROR
>;

export const setEmailNewPostsAction = async (
  tenantId: string,
  emailNewPosts: boolean,
): Promise<TSetEmailNewPostsResult> => {
  const { tenant } = await requireSubscribersManager(tenantId);

  const parsed = emailNewPostsSchema.safeParse(emailNewPosts);
  if (!parsed.success) return toOutcome(ACTION_OUTCOME.SERVER_ERROR);

  try {
    await queries.emailConfig.upsertEmailConfig(tenant.id, {
      emailNewPosts: parsed.data,
    });
  } catch (error) {
    logger.error(SUBSCRIBERS_LOG.SENDING_SAVE_FAILED, {
      tenantId: tenant.id,
      ...toLoggableError(error),
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }

  return toOutcome(ACTION_OUTCOME.SUCCESS);
};
