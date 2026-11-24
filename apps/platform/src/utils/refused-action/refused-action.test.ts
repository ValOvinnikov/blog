import { TEAM_REFUSAL } from '@platform/constants/team-access';
import { ACTION_OUTCOME } from '@shinefold/config';

import { refusedAction } from './refused-action';

describe(refusedAction, () => {
  it('refuses with the reason given', () => {
    expect(refusedAction(TEAM_REFUSAL.SELF)).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TEAM_REFUSAL.SELF,
    });
  });
});
