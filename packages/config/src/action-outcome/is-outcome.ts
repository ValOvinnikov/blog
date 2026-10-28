import { ACTION_OUTCOME, type TActionOutcome } from '@blog/config/constants';

const isOutcome =
  <TOutcome extends TActionOutcome>(outcome: TOutcome) =>
  <TResult extends { outcome: TActionOutcome }>(
    result: TResult,
  ): result is Extract<TResult, { outcome: TOutcome }> =>
    result.outcome === outcome;

export const isOutcomeSuccess = isOutcome(ACTION_OUTCOME.SUCCESS);
export const isOutcomeInvalid = isOutcome(ACTION_OUTCOME.INVALID);
export const isOutcomeServerError = isOutcome(ACTION_OUTCOME.SERVER_ERROR);
export const isOutcomeRefused = isOutcome(ACTION_OUTCOME.REFUSED);
export const isOutcomeUnavailable = isOutcome(ACTION_OUTCOME.UNAVAILABLE);
