import { TENANT_PROVISIONING_STEP_STATUS } from '@blog/db/constants';
import { customRender, screen } from '@platform/testing/custom-render';
import {
  MOCK_RUN_PLUS_6_MIN_AT,
  MOCK_RUN_STARTED_AT,
} from '@platform/testing/tenants/fixtures';

import { RunStepsCard } from './run-steps-card';

const STEPS_TOGGLE_NAME = /Steps/;
const SIX_MINUTES_AGO = '6m ago';
const ARIA_EXPANDED = 'aria-expanded';
const MOCK_ONLY_STEP_KEY = 'only';
const MOCK_ONLY_STEP_TITLE = 'Only step';

const setup = customRender(RunStepsCard, {
  title: 'Steps',
  isDone: false,
  steps: [
    {
      key: 'first',
      title: 'First step',
      status: TENANT_PROVISIONING_STEP_STATUS.DONE,
      updatedAt: MOCK_RUN_STARTED_AT,
    },
    {
      key: 'second',
      title: 'Second step',
      status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
    },
    {
      key: 'third',
      title: 'Third step',
      status: TENANT_PROVISIONING_STEP_STATUS.IDLE,
    },
  ],
});

describe(`<${RunStepsCard.name}/>`, () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(MOCK_RUN_PLUS_6_MIN_AT));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('with default steps', () => {
    beforeEach(() => {
      setup();
    });

    it('counts the steps that are done', () => {
      const progress = screen.getByText('1 of 3 done');

      expect(progress).toBeVisible();
    });

    it('dates a settled step and marks the running one as happening now', () => {
      const settledAge = screen.getByText(SIX_MINUTES_AGO);
      const runningAge = screen.getByText('now');

      expect(settledAge).toBeVisible();
      expect(runningAge).toBeVisible();
      expect(runningAge.tagName).not.toBe('TIME');
    });

    it('is expanded while the run is not done', () => {
      const toggle = screen.getByRole('button', { name: STEPS_TOGGLE_NAME });

      expect(toggle).toHaveAttribute(ARIA_EXPANDED, 'true');
    });
  });

  it.each([
    TENANT_PROVISIONING_STEP_STATUS.DONE,
    TENANT_PROVISIONING_STEP_STATUS.FAILED,
  ])('shows when a %s step settled, keeping the ISO time', (status) => {
    setup({
      steps: [
        {
          key: MOCK_ONLY_STEP_KEY,
          title: MOCK_ONLY_STEP_TITLE,
          status,
          updatedAt: MOCK_RUN_STARTED_AT,
        },
      ],
    });

    const settledAge = screen.getByText(SIX_MINUTES_AGO);

    expect(settledAge.tagName).toBe('TIME');
    expect(settledAge).toHaveAttribute('dateTime', MOCK_RUN_STARTED_AT);
  });

  it('keeps a settled step time out of its status live region', () => {
    setup({
      steps: [
        {
          key: MOCK_ONLY_STEP_KEY,
          title: MOCK_ONLY_STEP_TITLE,
          status: TENANT_PROVISIONING_STEP_STATUS.DONE,
          updatedAt: MOCK_RUN_STARTED_AT,
        },
      ],
    });

    const liveRegion = screen.getByTestId(
      `step-status-live-${MOCK_ONLY_STEP_KEY}`,
    );
    const settledAge = screen.getByText(SIX_MINUTES_AGO);

    expect(liveRegion).not.toContainElement(settledAge);
    expect(liveRegion.textContent).toBe('Complete');
  });

  it('shows no time for a done step with no recorded update', () => {
    setup({
      steps: [
        {
          key: MOCK_ONLY_STEP_KEY,
          title: MOCK_ONLY_STEP_TITLE,
          status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        },
      ],
    });

    const settledAge = screen.queryByText(/ago/);

    expect(settledAge).not.toBeInTheDocument();
  });

  it('is collapsed when the run is already done', () => {
    setup({ isDone: true });

    const toggle = screen.getByRole('button', { name: STEPS_TOGGLE_NAME });

    expect(toggle).toHaveAttribute(ARIA_EXPANDED, 'false');
  });

  it('labels every step as queued before the run has written any step', () => {
    setup({ isPreRun: true });

    const queuedLabels = screen.getAllByText('Queued');

    expect(queuedLabels).toHaveLength(3);
  });

  it('takes the heading level it is given', () => {
    setup({ headingLevel: 3 });

    const heading = screen.getByRole('heading', { level: 3, name: /Steps/ });

    expect(heading).toBeVisible();
  });
});
