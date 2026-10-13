import { TENANT_PROVISIONING_STEP_STATUS } from '@blog/db/constants';
import { customRender, screen } from '@platform/testing/custom-render';

import { RunStepsCard } from './run-steps-card';

const setup = customRender(RunStepsCard, {
  title: 'Steps',
  isDone: false,
  steps: [
    {
      key: 'first',
      title: 'First step',
      status: TENANT_PROVISIONING_STEP_STATUS.DONE,
      updatedAt: '2026-08-12T14:18:00.000Z',
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
    vi.setSystemTime(new Date('2026-08-12T14:24:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts the steps that are done', () => {
    setup();

    expect(screen.getByText('1 of 3 done')).toBeVisible();
  });

  it('dates a settled step and marks the running one as happening now', () => {
    setup();

    expect(screen.getByText('6m ago')).toBeVisible();
    expect(screen.getByText('now')).toBeVisible();
  });

  it('labels every step as queued before the run has written any step', () => {
    setup({ isPreRun: true });

    expect(screen.getAllByText('Queued')).toHaveLength(3);
  });

  it('takes the heading level it is given', () => {
    setup({ headingLevel: 3 });

    expect(
      screen.getByRole('heading', { level: 3, name: /Steps/ }),
    ).toBeVisible();
  });
});
