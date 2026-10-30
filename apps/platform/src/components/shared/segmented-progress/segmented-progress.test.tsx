import { customRender, screen } from '@platform/testing/custom-render';

import { SegmentedProgress } from './segmented-progress';

const MOCK_LABEL = 'Step 2 of 4';
const MOCK_VALUE = 2;
const MOCK_TOTAL = 4;
const SEGMENT_TEST_ID = 'segmented-progress-segment';

const setup = customRender(SegmentedProgress, {
  value: MOCK_VALUE,
  total: MOCK_TOTAL,
  label: MOCK_LABEL,
});

describe(`<${SegmentedProgress.name}/>`, () => {
  it('exposes a progress bar named and valued by its label', () => {
    setup();

    const progressBar = screen.getByRole('progressbar', { name: MOCK_LABEL });

    expect(progressBar).toHaveAttribute('aria-valuenow', String(MOCK_VALUE));
    expect(progressBar).toHaveAttribute('aria-valuemax', String(MOCK_TOTAL));
    expect(progressBar).toHaveAttribute('aria-valuetext', MOCK_LABEL);
  });

  it('renders one segment per step', () => {
    setup();

    const segments = screen.getAllByTestId(SEGMENT_TEST_ID);

    expect(segments).toHaveLength(MOCK_TOTAL);
  });

  it('fills the segments up to and including the current step', () => {
    setup();

    const segments = screen.getAllByTestId(SEGMENT_TEST_ID);
    const filled = segments.map(
      (segment) => segment.dataset['filled'] === 'true',
    );

    expect(filled).toEqual([true, true, false, false]);
  });
});
