import { ACTION_OUTCOME, type TActionResult } from '@shinefold/config';

export type TRefusalResult<TReason extends string> = TActionResult<
  typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
  never,
  never,
  TReason
>;

export const refusedAction = <TReason extends string>(
  reason: TReason,
): TRefusalResult<TReason> => ({
  outcome: ACTION_OUTCOME.REFUSED,
  reason,
});
