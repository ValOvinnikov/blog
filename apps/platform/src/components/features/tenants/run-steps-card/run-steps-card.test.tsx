import { TENANT_PROVISIONING_STEP_STATUS } from '@blog/db/constants';
import { customRender, screen } from '@platform/testing/custom-render';
import {
  MOCK_RUN_PLUS_6_MIN_AT,
  MOCK_RUN_STARTED_AT,
} from '@platform/testing/tenants/fixtures';

import { RunStepsCard } from './run-steps-card';

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
      const settledAge = screen.getByText('6m ago');
      const runningAge = screen.getByText('now');

      expect(settledAge).toBeVisible();
      expect(runningAge).toBeVisible();
    });
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
