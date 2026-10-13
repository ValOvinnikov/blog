import { STEP_INDICATOR_STATE } from '@platform/constants/step-indicator';
import { render, screen } from '@platform/testing/custom-render';

import { StepIndicator } from './step-indicator';

describe(StepIndicator, () => {
  it.each([
    [STEP_INDICATOR_STATE.DONE, '✓'],
    [STEP_INDICATOR_STATE.FAILED, '!'],
    [STEP_INDICATOR_STATE.RUNNING, '3'],
    [STEP_INDICATOR_STATE.ACTIVE, '3'],
    [STEP_INDICATOR_STATE.UPCOMING, '3'],
  ])('renders the %s state as a decorative %s', (state, glyph) => {
    render(<StepIndicator state={state} stepNumber={3} hasConnector={false} />);

    expect(
      screen.getByText(glyph, { selector: 'span[aria-hidden="true"]' }),
    ).toBeVisible();
  });

  it('renders a connector when it has one', () => {
    render(
      <StepIndicator
        state={STEP_INDICATOR_STATE.UPCOMING}
        stepNumber={1}
        hasConnector={true}
      />,
    );

    expect(screen.getByTestId('step-connector')).toBeInTheDocument();
  });

  it('omits the connector on the last step', () => {
    render(
      <StepIndicator
        state={STEP_INDICATOR_STATE.UPCOMING}
        stepNumber={1}
        hasConnector={false}
      />,
    );

    expect(screen.queryByTestId('step-connector')).not.toBeInTheDocument();
  });
});
