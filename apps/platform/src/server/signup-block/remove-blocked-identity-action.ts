'use server';

import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  type TActionResult,
} from '@blog/config';
import { ERROR_CODE } from '@blog/config/constants';
import { BLOCKED_IDENTITY_KIND, queries } from '@blog/db';
import { toOutcome } from '@blog/utils/to-outcome';
import {
  SIGNUP_BLOCK_REFUSAL,
  SIGNUP_BLOCK_LOG,
} from '@platform/constants/signup-block';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
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

    await recordAuditEvent({
      logEvent: SIGNUP_BLOCK_LOG.REMOVE_AUDIT_FAILED,
      action: AUDIT_ACTION.SIGNUP_BLOCK_REMOVED,
      targetType: AUDIT_TARGET_TYPE.BLOCKED_SIGNUP_IDENTITY,
      targetId: entry.id,
      details: {
        kind: entry.kind,
        ...(entry.kind === BLOCKED_IDENTITY_KIND.DOMAIN && {
          domain: entry.value,
        }),
      },
    });
  } catch (error) {
    logger.error(SIGNUP_BLOCK_LOG.REMOVE_FAILED, toLoggableError(error));
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }

  return toOutcome(ACTION_OUTCOME.SUCCESS);
};
