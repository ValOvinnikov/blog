import {
  DEPROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import { act, renderWithIntl, screen } from '@platform/testing/custom-render';
import {
  idleDeprovisioningSteps,
  makeClientTenant,
} from '@platform/testing/tenants/fixtures';

import { TenantDangerPageContent } from './tenant-danger-page-content';

const render = renderWithIntl;

const STEP_POLL_INTERVAL_MS = 4000;

const { getTenantDeprovisioningStatusActionMock } = vi.hoisted(() => ({
  getTenantDeprovisioningStatusActionMock: vi.fn(),
}));

vi.mock(
  '@platform/server/provisioning/get-tenant-deprovisioning-status-action',
  () => ({
    getTenantDeprovisioningStatusAction:
      getTenantDeprovisioningStatusActionMock,
  }),
);

vi.mock('@platform/server/provisioning/deprovision-tenant-action', () => ({
  deprovisionTenantAction: vi.fn(),
}));

vi.mock('@platform/server/provisioning/delete-tenant-action', () => ({
  deleteTenantAction: vi.fn(),
}));

vi.mock('@platform/server/provisioning/reactivate-tenant-action', () => ({
  reactivateTenantAction: vi.fn(),
}));

const runStarted = { startedAt: '2026-08-12T14:18:00.000Z' };

const failedSteps = {
  ...idleDeprovisioningSteps(),
  [DEPROVISIONING_STEP.REMOVE_DOMAIN]: {
    status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
    error: 'boom',
  },
  run: { ...runStarted, finishedAt: '2026-08-12T14:19:00.000Z' },
};

const getTrigger = () => screen.getByRole('button', { name: 'Deprovision' });

const advancePoll = async (ticks = 1) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS * ticks);
  });
};

describe(TenantDangerPageContent, () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    getTenantDeprovisioningStatusActionMock.mockReset();
    getTenantDeprovisioningStatusActionMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sends no status requests and shows no progress for a tenant that has never been deprovisioned', async () => {
    render(
      <TenantDangerPageContent
        tenant={makeClientTenant({ deprovisionedAt: null })}
      />,
    );

    await advancePoll(3);

    expect(getTrigger()).toBeEnabled();
    expect(getTrigger()).not.toHaveAttribute('aria-disabled');
    expect(screen.queryByText('Remove domain')).not.toBeInTheDocument();
    expect(getTenantDeprovisioningStatusActionMock).not.toHaveBeenCalled();
  });

  it('shows the starting state and keeps the trigger aria-disabled while a pending request has no run yet', async () => {
    render(
      <TenantDangerPageContent
        tenant={makeClientTenant({
          deprovisionedAt: null,
          deprovisioningSteps: null,
        })}
        deprovisionRequestedAt="2026-08-12T14:18:00.000Z"
      />,
    );

    expect(screen.getByText('Starting…')).toBeVisible();
    expect(getTrigger()).toHaveAttribute('aria-disabled', 'true');
    expect(getTrigger()).not.toBeDisabled();

    await advancePoll();

    expect(getTenantDeprovisioningStatusActionMock).toHaveBeenCalledWith(
      'tenant-1',
    );
    expect(getTrigger()).toHaveAttribute('aria-disabled', 'true');
  });

  it('keeps the trigger aria-disabled while a run is in progress and re-enables it once the run fails', async () => {
    getTenantDeprovisioningStatusActionMock.mockResolvedValue({
      deprovisioningSteps: failedSteps,
      deprovisionedAt: null,
    });
    render(
      <TenantDangerPageContent
        tenant={makeClientTenant({
          deprovisionedAt: null,
          deprovisioningSteps: {
            ...idleDeprovisioningSteps(),
            run: runStarted,
          },
        })}
      />,
    );

    expect(getTrigger()).toHaveAttribute('aria-disabled', 'true');

    await advancePoll();

    expect(getTrigger()).toBeEnabled();
    expect(getTrigger()).not.toHaveAttribute('aria-disabled');
  });

  it('keeps the trigger enabled and does not poll for a run that had already failed', async () => {
    render(
      <TenantDangerPageContent
        tenant={makeClientTenant({
          deprovisionedAt: null,
          deprovisioningSteps: failedSteps,
        })}
      />,
    );

    await advancePoll(2);

    expect(getTrigger()).toBeEnabled();
    expect(getTenantDeprovisioningStatusActionMock).not.toHaveBeenCalled();
  });
});
