import { ICON_TEST_ID } from '@platform/constants/icon';
import { STEP_INDICATOR_STATE } from '@platform/constants/step-indicator';
import { customRender, screen } from '@platform/testing/custom-render';

import { StepIndicator } from './step-indicator';

const MOCK_STEP_NUMBER = 3;
const STEP_CONNECTOR_TEST_ID = 'step-connector';

const setup = customRender(StepIndicator, {
  state: STEP_INDICATOR_STATE.UPCOMING,
  stepNumber: MOCK_STEP_NUMBER,
  hasConnector: false,
});

describe(`<${StepIndicator.name}/>`, () => {
  it.each([
    [STEP_INDICATOR_STATE.DONE, '✓'],
    [STEP_INDICATOR_STATE.FAILED, '!'],
    [STEP_INDICATOR_STATE.RUNNING, String(MOCK_STEP_NUMBER)],
    [STEP_INDICATOR_STATE.ACTIVE, String(MOCK_STEP_NUMBER)],
    [STEP_INDICATOR_STATE.UPCOMING, String(MOCK_STEP_NUMBER)],
  ])('renders the %s state as a decorative %s', (state, glyph) => {
    setup({ state });

    const indicatorGlyph = screen.getByText(glyph, {
      selector: 'span[aria-hidden="true"]',
    });

    expect(indicatorGlyph).toBeVisible();
  });

  it('draws a tick in place of the text glyph for a done step on dark', () => {
    setup({ state: STEP_INDICATOR_STATE.DONE, isOnDark: true });

    const tick = screen.getByTestId(ICON_TEST_ID);
    const textGlyph = screen.queryByText('✓');

    expect(tick).toBeInTheDocument();
    expect(textGlyph).not.toBeInTheDocument();
  });

  it('renders a connector when it has one', () => {
    setup({ hasConnector: true });

    const connector = screen.getByTestId(STEP_CONNECTOR_TEST_ID);

    expect(connector).toBeVisible();
  });

  it('omits the connector on the last step', () => {
    setup({ hasConnector: false });

    const connector = screen.queryByTestId(STEP_CONNECTOR_TEST_ID);

    expect(connector).not.toBeInTheDocument();
  });
});
