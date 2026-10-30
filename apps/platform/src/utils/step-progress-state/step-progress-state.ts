import { STEP_INDICATOR_STATE } from '@platform/constants/step-indicator';

export const toStepProgressState = (index: number, currentIndex: number) => {
  if (index < currentIndex) return STEP_INDICATOR_STATE.DONE;
  if (index === currentIndex) return STEP_INDICATOR_STATE.ACTIVE;
  return STEP_INDICATOR_STATE.UPCOMING;
};
