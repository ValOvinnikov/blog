import { STEP_INDICATOR_STATE } from '@platform/constants/step-indicator';

import { toStepProgressState } from './step-progress-state';

const CURRENT_INDEX = 2;

describe(toStepProgressState, () => {
  it.each([
    [1, STEP_INDICATOR_STATE.DONE],
    [CURRENT_INDEX, STEP_INDICATOR_STATE.ACTIVE],
    [3, STEP_INDICATOR_STATE.UPCOMING],
  ])('places step %i as %s', (index, state) => {
    expect(toStepProgressState(index, CURRENT_INDEX)).toBe(state);
  });
});
