import {
  ACTION_OUTCOME,
  type TActionOutcome,
} from '@shinefold/config/constants';
import type { TOutcome } from '@shinefold/config/types';

type TCanBe<
  TResult extends TOutcome<string>,
  TGuarded extends string,
> = TGuarded extends TResult['outcome'] ? unknown : never;

const isOutcome =
  <TGuarded extends TActionOutcome>(outcome: TGuarded) =>
  <TResult extends TOutcome<string>>(
    result: TResult & TCanBe<TResult, TGuarded>,
  ): result is Extract<TResult, TOutcome<TGuarded>> &
    TCanBe<TResult, TGuarded> =>
    result.outcome === outcome;

export const isOutcomeSuccess = isOutcome(ACTION_OUTCOME.SUCCESS);
export const isOutcomeInvalid = isOutcome(ACTION_OUTCOME.INVALID);
export const isOutcomeServerError = isOutcome(ACTION_OUTCOME.SERVER_ERROR);
export const isOutcomeRefused = isOutcome(ACTION_OUTCOME.REFUSED);
export const isOutcomeUnavailable = isOutcome(ACTION_OUTCOME.UNAVAILABLE);
export const isOutcomeRateLimited = isOutcome(ACTION_OUTCOME.RATE_LIMITED);
