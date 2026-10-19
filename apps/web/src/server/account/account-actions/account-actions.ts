'use server';

import { ACTION_OUTCOME, ERROR_CODE, type TActionResult } from '@blog/config';
import { queries } from '@blog/db';
import { auth } from '@web/server/auth/auth';
import { logger } from '@web/utils/logger/logger';

export type TDeleteAccountResult = TActionResult<
  typeof ACTION_OUTCOME.BLOCKED | typeof ACTION_OUTCOME.SERVER_ERROR
>;

const SERVER_ERROR = { outcome: ACTION_OUTCOME.SERVER_ERROR } as const;

export const deleteAccountAction = async (): Promise<TDeleteAccountResult> => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return SERVER_ERROR;

  try {
    const result = await queries.account.deleteAccount(userId);
    if (result.ok) return { outcome: ACTION_OUTCOME.SUCCESS };
    if (result.error === ERROR_CODE.DB_HOLDS_PLATFORM_ROLE) {
      return { outcome: ACTION_OUTCOME.BLOCKED };
    }
    logger.error('account.delete_failed', { error: result.error });
    return SERVER_ERROR;
  } catch (error) {
    logger.error('account.delete_failed', { error });
    return SERVER_ERROR;
  }
};
