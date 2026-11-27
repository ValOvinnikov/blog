'use server';

import {
  SIGNUP_BLOCK_REFUSAL,
  SIGNUP_BLOCK_LOG,
} from '@platform/constants/signup-block';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { recordSignupBlockRemoved } from '@platform/server/signup-block/signup-block-audit';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import { ACTION_OUTCOME, type TActionResult } from '@shinefold/config';
import { ERROR_CODE } from '@shinefold/config/constants';
import { queries } from '@shinefold/db';
import { toOutcome } from '@shinefold/utils/to-outcome';
import { z } from 'zod';

const removeBlockedIdentityInputSchema = z.string().min(1);

export type TRemoveBlockedIdentityResult = TActionResult<
  typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
  never,
  never,
  typeof SIGNUP_BLOCK_REFUSAL.ENTRY_NOT_FOUND
>;

const NOT_FOUND = {
  outcome: ACTION_OUTCOME.REFUSED,
  reason: SIGNUP_BLOCK_REFUSAL.ENTRY_NOT_FOUND,
} as const;

export const removeBlockedIdentityAction = async (
  id: string,
): Promise<TRemoveBlockedIdentityResult> => {
  await requireSuperAdmin();

  const parsed = removeBlockedIdentityInputSchema.safeParse(id);
  if (!parsed.success) return NOT_FOUND;

  try {
    const entries =
      await queries.blockedSignupIdentities.listBlockedIdentities();
    if (!entries.ok) {
      logger.error(SIGNUP_BLOCK_LOG.REMOVE_LOOKUP_FAILED, {
        error: entries.error,
      });
      return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
    }

    const entry = entries.data.find(
      (candidate) => candidate.id === parsed.data,
    );
    if (!entry) return NOT_FOUND;

    const removed = await queries.blockedSignupIdentities.removeBlockedIdentity(
      entry.id,
    );
    if (!removed.ok) {
      if (removed.error === ERROR_CODE.DB_NOT_FOUND) return NOT_FOUND;
      logger.error(SIGNUP_BLOCK_LOG.REMOVE_FAILED, { error: removed.error });
      return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
    }

    await recordSignupBlockRemoved(entry);
  } catch (error) {
    logger.error(SIGNUP_BLOCK_LOG.REMOVE_FAILED, toLoggableError(error));
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }

  return toOutcome(ACTION_OUTCOME.SUCCESS);
};
