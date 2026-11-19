'use server';

import { ACTION_OUTCOME, type TActionResult } from '@shinefold/config';
import {
  OAUTH_PROVIDER,
  type TOAuthProvider,
  UNLINK_PROVIDER_OUTCOME,
} from '@shinefold/config/constants';
import { queries } from '@shinefold/db';
import { hasLength } from '@shinefold/utils/primitives';
import { toOutcome } from '@shinefold/utils/to-outcome';
import { ACCOUNT_LOG } from '@web/constants/account';
import {
  FIELD_ERROR,
  type TFieldErrorReason,
} from '@web/constants/field-error';
import { auth } from '@web/server/auth/auth';
import { logger } from '@web/utils/logger/logger';

export type TLinkableProvider = TOAuthProvider;

const LINKABLE_PROVIDERS: readonly TLinkableProvider[] =
  Object.values(OAUTH_PROVIDER);

// A server action's endpoint can be called directly with any string, so the parameter type alone does not guard it.
const isLinkableProvider = (value: string): value is TLinkableProvider => {
  return (LINKABLE_PROVIDERS as readonly string[]).includes(value);
};

export type TUnlinkProviderResult = TActionResult<
  typeof ACTION_OUTCOME.BLOCKED | typeof ACTION_OUTCOME.SERVER_ERROR
>;

export type TUpdateDisplayNameResult = TActionResult<
  typeof ACTION_OUTCOME.SERVER_ERROR,
  'name',
  TFieldErrorReason
>;

const SUCCESS = toOutcome(ACTION_OUTCOME.SUCCESS);
const SERVER_ERROR = toOutcome(ACTION_OUTCOME.SERVER_ERROR);

export const unlinkProviderAction = async (
  provider: TLinkableProvider,
): Promise<TUnlinkProviderResult> => {
  if (!isLinkableProvider(provider)) return SERVER_ERROR;

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return SERVER_ERROR;

  try {
    const result = await queries.account.unlinkProvider(userId, provider);
    if (result.outcome === UNLINK_PROVIDER_OUTCOME.LAST_METHOD) {
      return toOutcome(ACTION_OUTCOME.BLOCKED);
    }
    return SUCCESS;
  } catch (error) {
    logger.error(ACCOUNT_LOG.PROVIDER_UNLINK_FAILED, { provider, error });
    return SERVER_ERROR;
  }
};

export const updateDisplayNameAction = async (
  name: string,
): Promise<TUpdateDisplayNameResult> => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return SERVER_ERROR;

  const trimmedName = name.trim();
  if (!hasLength(trimmedName)) {
    return {
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { name: { reason: FIELD_ERROR.INVALID } },
    };
  }

  try {
    await queries.account.updateDisplayName(userId, trimmedName);
    return SUCCESS;
  } catch (error) {
    logger.error(ACCOUNT_LOG.DISPLAY_NAME_UPDATE_FAILED, { error });
    return SERVER_ERROR;
  }
};
