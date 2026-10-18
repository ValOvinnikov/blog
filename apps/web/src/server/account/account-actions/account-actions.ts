'use server';

import { ACTION_OUTCOME, type TActionResult } from '@blog/config';
import { queries } from '@blog/db';
import { auth } from '@web/server/auth/auth';
import { logger } from '@web/utils/logger/logger';

export type TDeleteAccountResult = TActionResult<
  typeof ACTION_OUTCOME.SERVER_ERROR
>;

const SERVER_ERROR = { outcome: ACTION_OUTCOME.SERVER_ERROR } as const;

export const deleteAccountAction = async (): Promise<TDeleteAccountResult> => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return SERVER_ERROR;

  try {
    await queries.account.deleteAccount(userId);
    return { outcome: ACTION_OUTCOME.SUCCESS };
  } catch (error) {
    logger.error('account.delete_failed', { error });
    return SERVER_ERROR;
  }
};
