import type { TTeamRefusal } from '@platform/constants/team-access';
import { ACTION_OUTCOME, type TActionResult } from '@shinefold/config';

export type TTeamRefusalResult = TActionResult<
  typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
  never,
  never,
  TTeamRefusal
>;

export const refusedTeamAction = (
  reason: TTeamRefusal,
): TTeamRefusalResult => ({
  outcome: ACTION_OUTCOME.REFUSED,
  reason,
});
