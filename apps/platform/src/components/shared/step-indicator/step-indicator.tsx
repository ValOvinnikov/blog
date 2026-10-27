import {
  STEP_INDICATOR_STATE,
  type TStepIndicatorState,
} from '@platform/constants/step-indicator';

import { stepIndicatorVariants } from './step-indicator-variants';

type TStepIndicatorProps = {
  state: TStepIndicatorState;
  stepNumber: number;
  hasConnector: boolean;
  isConnectorDone?: boolean;
};

const GLYPH_BY_STATE: Partial<Record<TStepIndicatorState, string>> = {
  [STEP_INDICATOR_STATE.DONE]: '✓',
  [STEP_INDICATOR_STATE.FAILED]: '!',
};

export const StepIndicator = ({
  state,
  stepNumber,
  hasConnector,
  isConnectorDone,
}: TStepIndicatorProps) => {
  const { root, circle, connector } = stepIndicatorVariants({
    state,
    isConnectorDone,
  });

  return (
    <div className={root()}>
      <span
        className={circle()}
        aria-hidden="true"
        data-testid="step-indicator-glyph"
      >
        {GLYPH_BY_STATE[state] ?? stepNumber}
      </span>
      {hasConnector && (
        <span
          className={connector()}
          aria-hidden="true"
          data-testid="step-connector"
        />
      )}
    </div>
  );
};
