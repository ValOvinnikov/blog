import { ACTION_OUTCOME } from '@blog/config';
import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import { TENANT_REFUSAL } from '@platform/constants/tenant';
import { getTenantProvisioningStatusAction } from '@platform/server/provisioning/get-tenant-provisioning-status-action';
import { retryProvisioningStepAction } from '@platform/server/provisioning/retry-provisioning-step-action';
import { customRender, screen } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  idleProvisioningSteps,
  makeClientTenant,
} from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { SiteSetupCard } from './site-setup-card';

vi.mock('@platform/server/provisioning/retry-provisioning-step-action');

vi.mock('@platform/server/provisioning/get-tenant-provisioning-status-action');

const retryProvisioningStepActionMock = vi.mocked(retryProvisioningStepAction);
const getTenantProvisioningStatusActionMock = vi.mocked(
  getTenantProvisioningStatusAction,
);

const failedTenant = makeClientTenant({
  provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED,
  provisioningSteps: {
    ...idleProvisioningSteps(),
    [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
      status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
      error: 'boom',
    },
  },
});

const setup = customRender(SiteSetupCard, {
  tenant: failedTenant,
  canRetry: true,
});

describe(`<${SiteSetupCard.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    mockRouterRefresh();
    retryProvisioningStepActionMock.mockReset();
    getTenantProvisioningStatusActionMock.mockReset().mockResolvedValue({
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      provisioningSteps: idleProvisioningSteps(),
    });
  });

  it('lists the setup steps', () => {
    setup({ tenant: makeClientTenant() });

    const settingUpYourSiteHeading = screen.getByRole('heading', {
      level: 2,
      name: /Setting up your site/,
    });
    const setupStoppedText = screen.queryByText("Your site's setup stopped");

    expect(settingUpYourSiteHeading).toBeVisible();
    expect(setupStoppedText).not.toBeInTheDocument();
  });

  it('points a viewer who cannot retry at their platform contact', () => {
    setup({ canRetry: false });

    const oneOfTheText = screen.getByText(
      'One of the steps hit a problem. Ask your platform contact to restart it.',
    );
    const tryAgainButton = screen.queryByRole('button', { name: 'Try again' });

    expect(oneOfTheText).toBeVisible();
    expect(tryAgainButton).not.toBeInTheDocument();
  });

  describe('when the viewer can retry a failed setup', () => {
    const clickTryAgain = () =>
      user.click(screen.getByRole('button', { name: 'Try again' }));

    beforeEach(() => {
      setup();
    });

    it('explains that the setup stopped', () => {
      const setupStoppedText = screen.getByText("Your site's setup stopped");

      expect(setupStoppedText).toBeVisible();
    });

    it('restarts the setup on Try again', async () => {
      await clickTryAgain();

      expect(retryProvisioningStepActionMock).toHaveBeenCalledWith('tenant-1');
    });

    it('reports a retry that could not start', async () => {
      retryProvisioningStepActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SERVER_ERROR,
      });

      await clickTryAgain();

      const couldNotRestartText = await screen.findByText(
        "Couldn't restart the setup — try again.",
      );

      expect(couldNotRestartText).toBeVisible();
    });

    it('treats a run already under way as no failure', async () => {
      retryProvisioningStepActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: TENANT_REFUSAL.ALREADY_IN_PROGRESS,
      });

      await clickTryAgain();

      const couldNotRestartText = screen.queryByText(
        "Couldn't restart the setup — try again.",
      );

      expect(couldNotRestartText).not.toBeInTheDocument();
    });
  });
});
