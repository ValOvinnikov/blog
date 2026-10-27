import { ACTION_OUTCOME } from '@blog/config';
import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import { TENANT_REFUSAL } from '@platform/constants/tenant';
import { getTenantProvisioningStatusAction } from '@platform/server/provisioning/get-tenant-provisioning-status-action';
import { retryProvisioningStepAction } from '@platform/server/provisioning/retry-provisioning-step-action';
import { customRender, screen } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  mockIdleProvisioningSteps,
  mockClientTenant,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { SiteSetupCard } from './site-setup-card';

vi.mock('@platform/server/provisioning/retry-provisioning-step-action');

vi.mock('@platform/server/provisioning/get-tenant-provisioning-status-action');

faker.seed(4417);

const MOCK_STEP_ERROR = faker.lorem.sentence();

const retryProvisioningStepActionMock = vi.mocked(retryProvisioningStepAction);
const getTenantProvisioningStatusActionMock = vi.mocked(
  getTenantProvisioningStatusAction,
);

const failedTenant = mockClientTenant({
  provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED,
  provisioningSteps: {
    ...mockIdleProvisioningSteps(),
    [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
      status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
      error: MOCK_STEP_ERROR,
    },
  },
});

const notStartedTenant = mockClientTenant();

const setup = customRender(SiteSetupCard, {
  tenant: failedTenant,
  canRetry: true,
});

const YOUR_SITES_SETUP_STOPPED = "Your site's setup stopped";
const COULDNT_RESTART_SETUP_TRY = "Couldn't restart the setup — try again.";
const SETUP_NOT_STARTED = "Your site's setup hasn't started";
const START_SETUP = 'Start setup';

describe(`<${SiteSetupCard.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    mockRouterRefresh();
    retryProvisioningStepActionMock.mockReset();
    getTenantProvisioningStatusActionMock.mockReset().mockResolvedValue({
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      provisioningSteps: mockIdleProvisioningSteps(),
    });
  });

  it('lists the setup steps', () => {
    setup({
      tenant: mockClientTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      }),
    });

    const settingUpYourSiteHeading = screen.getByRole('heading', {
      level: 2,
      name: /Setting up your site/,
    });
    const setupStoppedText = screen.queryByText(YOUR_SITES_SETUP_STOPPED);
    const notStartedText = screen.queryByText(SETUP_NOT_STARTED);

    expect(settingUpYourSiteHeading).toBeVisible();
    expect(setupStoppedText).not.toBeInTheDocument();
    expect(notStartedText).not.toBeInTheDocument();
  });

  it('points a viewer who cannot start setup at their platform contact', () => {
    setup({ tenant: notStartedTenant, canRetry: false });

    const contactText = screen.getByText(
      "We couldn't start setting up your site. Ask your platform contact to start it.",
    );
    const startSetupButton = screen.queryByRole('button', {
      name: START_SETUP,
    });

    expect(contactText).toBeVisible();
    expect(startSetupButton).not.toBeInTheDocument();
  });

  describe('when the viewer can start a setup that never started', () => {
    const clickStartSetup = async () => {
      const startSetupButton = screen.getByRole('button', {
        name: START_SETUP,
      });
      await user.click(startSetupButton);
    };

    beforeEach(() => {
      setup({ tenant: notStartedTenant });
    });

    it('says the setup has not started', () => {
      const notStartedText = screen.getByText(SETUP_NOT_STARTED);

      expect(notStartedText).toBeVisible();
    });

    it('starts it once on Start setup', async () => {
      await clickStartSetup();

      expect(retryProvisioningStepActionMock).toHaveBeenCalledExactlyOnceWith(
        MOCK_TENANT_ID,
      );
    });

    it('reports a start that failed again', async () => {
      retryProvisioningStepActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SERVER_ERROR,
      });

      await clickStartSetup();

      const couldNotRestartText = await screen.findByText(
        COULDNT_RESTART_SETUP_TRY,
      );

      expect(couldNotRestartText).toBeVisible();
    });
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
    const clickTryAgain = async () => {
      const tryAgainButton = screen.getByRole('button', { name: 'Try again' });
      await user.click(tryAgainButton);
    };

    beforeEach(() => {
      setup();
    });

    it('explains that the setup stopped', () => {
      const setupStoppedText = screen.getByText(YOUR_SITES_SETUP_STOPPED);

      expect(setupStoppedText).toBeVisible();
    });

    it('restarts the setup on Try again', async () => {
      await clickTryAgain();

      expect(retryProvisioningStepActionMock).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
      );
    });

    it('reports a retry that could not start', async () => {
      retryProvisioningStepActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SERVER_ERROR,
      });

      await clickTryAgain();

      const couldNotRestartText = await screen.findByText(
        COULDNT_RESTART_SETUP_TRY,
      );

      expect(couldNotRestartText).toBeVisible();
    });

    it('treats a run already under way as no failure', async () => {
      retryProvisioningStepActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: TENANT_REFUSAL.ALREADY_IN_PROGRESS,
      });

      await clickTryAgain();

      const couldNotRestartText = screen.queryByText(COULDNT_RESTART_SETUP_TRY);

      expect(couldNotRestartText).not.toBeInTheDocument();
    });
  });
});
