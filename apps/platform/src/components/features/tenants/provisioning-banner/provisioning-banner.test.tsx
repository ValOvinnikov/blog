import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db';
import { ELEVATE_TENANT_OWNER_OUTCOME } from '@blog/db/constants';
import { customRender, screen } from '@platform/testing/custom-render';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';

import {
  ProvisioningBanner,
  type TProvisioningBannerProps,
} from './provisioning-banner';

const { IDLE, RUNNING, DONE, FAILED } = TENANT_PROVISIONING_STEP_STATUS;

type TPoll = TProvisioningBannerProps['poll'];

const IDLE_POLL: TPoll = {
  provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
  stepStatuses: [IDLE, IDLE, IDLE, IDLE, IDLE, IDLE],
  isOverallFailed: false,
  isProvisioningRunning: false,
  errorKind: undefined,
  ownerElevationOutcome: undefined,
};

const READY_POLL: TPoll = {
  ...IDLE_POLL,
  provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
  stepStatuses: [DONE, DONE, DONE, DONE, DONE, DONE],
};

const VIEW_STEPS = 'View steps';
const PROVISIONED = 'Provisioned';
const OWNER_INVITE_STALLED = 'Owner invite stalled';
const OWNER_MEMBERSHIP_UNCLEAR = 'Owner membership unclear';

const customSetup = customRender(ProvisioningBanner, {
  tenantId: MOCK_TENANT_ID,
  poll: IDLE_POLL,
});

const setup = (poll: Partial<TPoll> = {}) =>
  customSetup({ poll: { ...IDLE_POLL, ...poll } });

describe(`<${ProvisioningBanner.name}/>`, () => {
  it('renders nothing for a tenant that has not started provisioning', () => {
    setup();

    const status = screen.queryByRole('status');
    const alert = screen.queryByRole('alert');
    const link = screen.queryByRole('link');

    expect(status).not.toBeInTheDocument();
    expect(alert).not.toBeInTheDocument();
    expect(link).not.toBeInTheDocument();
  });

  it('shows the current step and a link to the steps while running', () => {
    setup({
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      stepStatuses: [DONE, DONE, RUNNING, IDLE, IDLE, IDLE],
      isProvisioningRunning: true,
    });

    const progress = screen.getByText('Provisioning — step 3 of 6');
    const viewStepsLink = screen.getByRole('link', { name: VIEW_STEPS });

    expect(progress).toBeVisible();
    expect(viewStepsLink).toHaveAttribute(
      'href',
      `/tenants/${MOCK_TENANT_ID}/provisioning`,
    );
  });

  it('shows the failed step and its classified error while stuck', () => {
    setup({
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      stepStatuses: [DONE, DONE, DONE, FAILED, IDLE, IDLE],
      isOverallFailed: true,
      errorKind: 'duplicate',
    });

    const failure = screen.getByText('Provisioning failed at step 4 of 6');
    const error = screen.getByText(
      'Connect domain — Already in use by another tenant',
    );

    expect(failure).toBeVisible();
    expect(error).toBeVisible();
  });

  it('shows a one-line confirmation and a link to the steps when ready', () => {
    setup(READY_POLL);

    const confirmation = screen.getByText(PROVISIONED);
    const viewStepsLink = screen.getByRole('link', { name: VIEW_STEPS });

    expect(confirmation).toBeVisible();
    expect(viewStepsLink).toBeVisible();
  });

  it.each([
    {
      outcome: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
      heading: OWNER_INVITE_STALLED,
      description:
        "The owner hasn't accepted their invite yet — nothing failed, but they can't edit their own content until they do.",
    },
    {
      outcome: ELEVATE_TENANT_OWNER_OUTCOME.AMBIGUOUS_MEMBERSHIP,
      heading: OWNER_MEMBERSHIP_UNCLEAR,
      description:
        "More than one membership matches this tenant's owner — resolve it manually in Sanity Manage.",
    },
  ])(
    'explains a $outcome owner elevation without raising an alert',
    ({ outcome, heading, description }) => {
      setup({ ...READY_POLL, ownerElevationOutcome: outcome });

      const headingElement = screen.getByText(heading);
      const descriptionElement = screen.getByText(description);
      const alert = screen.queryByRole('alert');
      const statusRows = screen.getAllByRole('status');

      expect(headingElement).toBeVisible();
      expect(descriptionElement).toBeVisible();
      expect(alert).not.toBeInTheDocument();
      expect(statusRows).toHaveLength(2);
    },
  );

  it.each([
    ELEVATE_TENANT_OWNER_OUTCOME.ELEVATED,
    ELEVATE_TENANT_OWNER_OUTCOME.ALREADY_ADMINISTRATOR,
    ELEVATE_TENANT_OWNER_OUTCOME.PENDING_ACCEPTANCE,
  ])('shows only the confirmation for a %s owner elevation', (outcome) => {
    setup({ ...READY_POLL, ownerElevationOutcome: outcome });

    const confirmation = screen.getByText(PROVISIONED);
    const statusRows = screen.getAllByRole('status');

    expect(confirmation).toBeVisible();
    expect(statusRows).toHaveLength(1);
  });

  it.each([
    {
      stepStatus: RUNNING,
      poll: { isProvisioningRunning: true },
      outcome: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
      heading: OWNER_INVITE_STALLED,
    },
    {
      stepStatus: FAILED,
      poll: { isOverallFailed: true, errorKind: 'duplicate' as const },
      outcome: ELEVATE_TENANT_OWNER_OUTCOME.AMBIGUOUS_MEMBERSHIP,
      heading: OWNER_MEMBERSHIP_UNCLEAR,
    },
  ])(
    'hides the owner elevation while a step is $stepStatus',
    ({ stepStatus, poll, outcome, heading }) => {
      setup({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        stepStatuses: [DONE, stepStatus, IDLE, IDLE, IDLE, IDLE],
        ...poll,
        ownerElevationOutcome: outcome,
      });

      const elevationRow = screen.queryByText(heading);

      expect(elevationRow).not.toBeInTheDocument();
    },
  );
});
