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

    expect(screen.getByText('Failed')).toBeVisible();
  });

  it('reads Starting before the run has written any step', () => {
    setup({ status: TENANT_PROVISIONING_STEP_STATUS.IDLE, isPreRun: true });

    expect(screen.getByText('Starting…')).toBeVisible();
    expect(screen.queryByText('Not started')).not.toBeInTheDocument();
  });
});
