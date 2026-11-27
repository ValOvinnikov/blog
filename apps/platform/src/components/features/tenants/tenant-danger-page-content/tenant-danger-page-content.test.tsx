import { faker } from '@faker-js/faker';
import { ARIA_ATTRIBUTE } from '@platform/constants/aria-attribute';
import { getTenantDeprovisioningStatusAction } from '@platform/server/provisioning/get-tenant-deprovisioning-status-action';
import { act, customRender, screen } from '@platform/testing/custom-render';
import {
  mockIdleDeprovisioningSteps,
  mockClientTenant,
  MOCK_RUN_PLUS_1_MIN_AT,
  MOCK_RUN_STARTED_AT,
  MOCK_TENANT_ID,
  PLATFORM_TENANT_NOTICE_TEXT,
} from '@platform/testing/tenants/fixtures';
import { STEP_POLL_INTERVAL_MS } from '@platform/utils/use-deprovisioning-poll/use-deprovisioning-poll';
import {
  DEPROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@shinefold/db/constants';

import { TenantDangerPageContent } from './tenant-danger-page-content';

faker.seed(6120);

const MOCK_STEP_ERROR = faker.lorem.sentence();

vi.mock(
  '@platform/server/provisioning/get-tenant-deprovisioning-status-action',
);

const getTenantDeprovisioningStatusActionMock = vi.mocked(
  getTenantDeprovisioningStatusAction,
);

vi.mock('@platform/server/provisioning/deprovision-tenant-action');

vi.mock('@platform/server/provisioning/delete-tenant-action');

vi.mock('@platform/server/provisioning/reactivate-tenant-action');

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
  isPlatformTenant: false,
});

const getTrigger = () => screen.getByRole('button', { name: 'Deprovision' });

const advancePoll = async (ticks = 1) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS * ticks);
  });
};

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
    expect(trigger).not.toHaveAttribute(ARIA_ATTRIBUTE.DISABLED);
    expect(removeDomainStep).not.toBeInTheDocument();
    expect(getTenantDeprovisioningStatusActionMock).not.toHaveBeenCalled();
  });

  it('offers no Deprovision on the platform tenant, and says why', () => {
    setup({ isPlatformTenant: true });

    const trigger = screen.queryByRole('button', { name: 'Deprovision' });
    const notice = screen.getByText(PLATFORM_TENANT_NOTICE_TEXT);

    expect(trigger).not.toBeInTheDocument();
    expect(notice).toBeVisible();
  });

  it('shows the starting state while a requested run has not begun', async () => {
    setup({ deprovisionRequestedAt: MOCK_RUN_STARTED_AT });

    const startingState = screen.getByText('Starting…');
    const trigger = getTrigger();

    expect(startingState).toBeVisible();
    expect(trigger).toHaveAttribute(ARIA_ATTRIBUTE.DISABLED, 'true');
    expect(trigger).not.toBeDisabled();

    await advancePoll();

    const triggerAfterPoll = getTrigger();

    expect(getTenantDeprovisioningStatusActionMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
    );
    expect(triggerAfterPoll).toHaveAttribute(ARIA_ATTRIBUTE.DISABLED, 'true');
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

    expect(triggerWhileRunning).toHaveAttribute(
      ARIA_ATTRIBUTE.DISABLED,
      'true',
    );

    await advancePoll();

    const triggerAfterFailure = getTrigger();

    expect(triggerAfterFailure).toBeEnabled();
    expect(triggerAfterFailure).not.toHaveAttribute(ARIA_ATTRIBUTE.DISABLED);
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
