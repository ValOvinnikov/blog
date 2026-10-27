import { TENANT_PROVISIONING_STEP_STATUS } from '@blog/db/constants';
import { customRender, screen } from '@platform/testing/custom-render';

import { RunStatusBadge } from './run-status-badge';

const setup = customRender(RunStatusBadge, {
  status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
});

describe(`<${RunStatusBadge.name}/>`, () => {
  it('announces the run status politely', () => {
    setup();

    const liveRegion = screen.getByTestId('run-status-live');

    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    expect(liveRegion).toHaveTextContent('Running…');
  });

  it('reads Failed for a failed run', () => {
    setup({ status: TENANT_PROVISIONING_STEP_STATUS.FAILED });

    const failed = screen.getByText('Failed');

    expect(failed).toBeVisible();
  });

  it('reads Starting before the run has written any step', () => {
    setup({ status: TENANT_PROVISIONING_STEP_STATUS.IDLE, isPreRun: true });

    const starting = screen.getByText('Starting…');
    const notStarted = screen.queryByText('Not started');

    expect(starting).toBeVisible();
    expect(notStarted).not.toBeInTheDocument();
  });
});
