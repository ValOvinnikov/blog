import { STEP_INDICATOR_STATE } from '@platform/constants/step-indicator';
import {
  ARIA_VALUEMAX,
  ARIA_VALUENOW,
  ARIA_VALUETEXT,
} from '@platform/testing/aria';
import {
  customRender,
  isInaccessible,
  screen,
} from '@platform/testing/custom-render';

import { SegmentedProgress } from './segmented-progress';

const MOCK_ARIA_LABEL = 'Setup steps';
const MOCK_VALUE_TEXT = 'Step 2 of 4';
const MOCK_VALUE = 2;
const MOCK_TOTAL = 4;
const SEGMENT_TEST_ID = 'segmented-progress-segment';

const setup = customRender(SegmentedProgress, {
  value: MOCK_VALUE,
  total: MOCK_TOTAL,
  ariaLabel: MOCK_ARIA_LABEL,
  valueText: MOCK_VALUE_TEXT,
});

describe(`<${SegmentedProgress.name}/>`, () => {
  beforeEach(() => {
    setup();
  });

  it('exposes a progress bar named by its label and valued by its text', () => {
    const progressBar = screen.getByRole('progressbar', {
      name: MOCK_ARIA_LABEL,
    });

    expect(progressBar).toHaveAttribute(ARIA_VALUENOW, String(MOCK_VALUE));
    expect(progressBar).toHaveAttribute(ARIA_VALUEMAX, String(MOCK_TOTAL));
    expect(progressBar).toHaveAttribute(ARIA_VALUETEXT, MOCK_VALUE_TEXT);
  });

  it('shows its text without exposing it a second time', () => {
    const visibleText = screen.getByText(MOCK_VALUE_TEXT);

    expect(visibleText).toBeVisible();
    expect(isInaccessible(visibleText)).toBe(true);
  });

  it('renders one segment per step, hidden from assistive tech', () => {
    const segments = screen.getAllByTestId(SEGMENT_TEST_ID);

    expect(segments).toHaveLength(MOCK_TOTAL);
    expect(segments.every((segment) => isInaccessible(segment))).toBe(true);
  });

  it('marks earlier steps done, the current step active and later steps upcoming', () => {
    const states = screen
      .getAllByTestId(SEGMENT_TEST_ID)
      .map((segment) => segment.dataset['state']);

    expect(states).toEqual([
      STEP_INDICATOR_STATE.DONE,
      STEP_INDICATOR_STATE.ACTIVE,
      STEP_INDICATOR_STATE.UPCOMING,
      STEP_INDICATOR_STATE.UPCOMING,
    ]);
  });
});
