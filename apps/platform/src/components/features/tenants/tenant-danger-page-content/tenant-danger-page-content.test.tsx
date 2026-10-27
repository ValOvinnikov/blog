import {
  DEPROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import { act, customRender, screen } from '@platform/testing/custom-render';
import {
  mockIdleDeprovisioningSteps,
  mockClientTenant,
  MOCK_RUN_PLUS_1_MIN_AT,
  MOCK_RUN_STARTED_AT,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';

import { TenantDangerPageContent } from './tenant-danger-page-content';

faker.seed(6120);

const MOCK_STEP_ERROR = faker.lorem.sentence();

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

const runStarted = { startedAt: MOCK_RUN_STARTED_AT };

const failedSteps = {
  ...mockIdleDeprovisioningSteps(),
  [DEPROVISIONING_STEP.REMOVE_DOMAIN]: {
    status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
    error: MOCK_STEP_ERROR,
  },
  run: { ...runStarted, finishedAt: MOCK_RUN_PLUS_1_MIN_AT },
};

const setup = customRender(TenantDangerPageContent, {
  tenant: mockClientTenant({ deprovisionedAt: null }),
});

const getTrigger = () => screen.getByRole('button', { name: 'Deprovision' });

const advancePoll = async (ticks = 1) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS * ticks);
  });
};

const ARIA_DISABLED = 'aria-disabled';

describe(`<${TenantDangerPageContent.name}/>`, () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    getTenantDeprovisioningStatusActionMock.mockReset();
    getTenantDeprovisioningStatusActionMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sends no status requests for a tenant that was never deprovisioned', async () => {
    setup();

    await advancePoll(3);

    const trigger = getTrigger();
    const removeDomainStep = screen.queryByText('Remove domain');

    expect(trigger).toBeEnabled();
    expect(trigger).not.toHaveAttribute(ARIA_DISABLED);
    expect(removeDomainStep).not.toBeInTheDocument();
    expect(getTenantDeprovisioningStatusActionMock).not.toHaveBeenCalled();
  });

  it('shows the starting state while a requested run has not begun', async () => {
    setup({ deprovisionRequestedAt: MOCK_RUN_STARTED_AT });

    const startingState = screen.getByText('Starting…');
    const trigger = getTrigger();

    expect(startingState).toBeVisible();
    expect(trigger).toHaveAttribute(ARIA_DISABLED, 'true');
    expect(trigger).not.toBeDisabled();

    await advancePoll();

    const triggerAfterPoll = getTrigger();

    expect(getTenantDeprovisioningStatusActionMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
    );
    expect(triggerAfterPoll).toHaveAttribute(ARIA_DISABLED, 'true');
  });

  it('blocks the trigger during a run and re-enables it once the run fails', async () => {
    getTenantDeprovisioningStatusActionMock.mockResolvedValue({
      deprovisioningSteps: failedSteps,
      deprovisionedAt: null,
    });
    setup({
      tenant: mockClientTenant({
        deprovisionedAt: null,
        deprovisioningSteps: {
          ...mockIdleDeprovisioningSteps(),
          run: runStarted,
        },
      }),
    });

    const triggerWhileRunning = getTrigger();

    expect(triggerWhileRunning).toHaveAttribute(ARIA_DISABLED, 'true');

    await advancePoll();

    const triggerAfterFailure = getTrigger();

    expect(triggerAfterFailure).toBeEnabled();
    expect(triggerAfterFailure).not.toHaveAttribute(ARIA_DISABLED);
  });

  it('keeps the trigger enabled and stops polling for an already failed run', async () => {
    setup({
      tenant: mockClientTenant({
        deprovisionedAt: null,
        deprovisioningSteps: failedSteps,
      }),
    });

    await advancePoll(2);

    const trigger = getTrigger();

    expect(trigger).toBeEnabled();
    expect(getTenantDeprovisioningStatusActionMock).not.toHaveBeenCalled();
  });
});
