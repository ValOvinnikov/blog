import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db';
import { ELEVATE_TENANT_OWNER_OUTCOME } from '@blog/db/constants';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';

import {
  ProvisioningBanner,
  type TProvisioningBannerProps,
} from './provisioning-banner';

const idleStepStatuses = () =>
  Array(6).fill(TENANT_PROVISIONING_STEP_STATUS.IDLE);

type TPoll = TProvisioningBannerProps['poll'];

const idlePoll: TPoll = {
  provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
  stepStatuses: idleStepStatuses(),
  isOverallFailed: false,
  isProvisioningRunning: false,
  errorKind: undefined,
  ownerElevationOutcome: undefined,
};

const setup = (poll: Partial<TPoll> = {}) =>
  renderWithIntl(
    <ProvisioningBanner
      tenantId={MOCK_TENANT_ID}
      poll={{ ...idlePoll, ...poll }}
    />,
  );

const READY_STEP_STATUSES = Array(6).fill(TENANT_PROVISIONING_STEP_STATUS.DONE);

const VIEW_STEPS = 'View steps';
const OWNER_INVITE_STALLED = 'Owner invite stalled';
const OWNER_MEMBERSHIP_UNCLEAR = 'Owner membership unclear';

describe(`<${ProvisioningBanner.name}/>`, () => {
  it('renders nothing for a tenant that has not started provisioning', () => {
    setup();

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('shows the current step and a link to the provisioning page while running', () => {
    setup({
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      stepStatuses: [
        TENANT_PROVISIONING_STEP_STATUS.DONE,
        TENANT_PROVISIONING_STEP_STATUS.DONE,
        TENANT_PROVISIONING_STEP_STATUS.RUNNING,
        TENANT_PROVISIONING_STEP_STATUS.IDLE,
        TENANT_PROVISIONING_STEP_STATUS.IDLE,
        TENANT_PROVISIONING_STEP_STATUS.IDLE,
      ],
      isProvisioningRunning: true,
    });

    expect(screen.getByText('Provisioning — step 3 of 6')).toBeVisible();
    expect(screen.getByRole('link', { name: VIEW_STEPS })).toHaveAttribute(
      'href',
      `/tenants/${MOCK_TENANT_ID}/provisioning`,
    );
  });

  it('shows the failed step and its classified error while stuck', () => {
    setup({
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      stepStatuses: [
        TENANT_PROVISIONING_STEP_STATUS.DONE,
        TENANT_PROVISIONING_STEP_STATUS.DONE,
        TENANT_PROVISIONING_STEP_STATUS.DONE,
        TENANT_PROVISIONING_STEP_STATUS.FAILED,
        TENANT_PROVISIONING_STEP_STATUS.IDLE,
        TENANT_PROVISIONING_STEP_STATUS.IDLE,
      ],
      isOverallFailed: true,
      errorKind: 'duplicate',
    });

    expect(
      screen.getByText('Provisioning failed at step 4 of 6'),
    ).toBeVisible();
    expect(
      screen.getByText('Connect domain — Already in use by another tenant'),
    ).toBeVisible();
  });

  it('shows a one-line confirmation and a link to the steps when ready', () => {
    setup({
      provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
      stepStatuses: READY_STEP_STATUSES,
    });

    expect(screen.getByText('Provisioned')).toBeVisible();
    expect(screen.getByRole('link', { name: VIEW_STEPS })).toBeVisible();
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
    'shows a status-role owner-elevation row for a $outcome outcome when ready',
    ({ outcome, heading, description }) => {
      setup({
        provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
        stepStatuses: READY_STEP_STATUSES,
        ownerElevationOutcome: outcome,
      });

      expect(screen.getByText(heading)).toBeVisible();
      expect(screen.getByText(description)).toBeVisible();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getAllByRole('status')).toHaveLength(2);
    },
  );

  it.each([
    ELEVATE_TENANT_OWNER_OUTCOME.ELEVATED,
    ELEVATE_TENANT_OWNER_OUTCOME.ALREADY_ADMINISTRATOR,
    ELEVATE_TENANT_OWNER_OUTCOME.PENDING_ACCEPTANCE,
  ] as const)(
    'renders nothing extra for a %s outcome when ready',
    (outcome) => {
      setup({
        provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
        stepStatuses: READY_STEP_STATUSES,
        ownerElevationOutcome: outcome,
      });

      expect(screen.getByText('Provisioned')).toBeVisible();
      expect(screen.getAllByRole('status')).toHaveLength(1);
    },
  );

  it.each([
    {
      stepStatus: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      poll: { isProvisioningRunning: true },
      outcome: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
      heading: OWNER_INVITE_STALLED,
    },
    {
      stepStatus: TENANT_PROVISIONING_STEP_STATUS.FAILED,
      poll: { isOverallFailed: true, errorKind: 'duplicate' as const },
      outcome: ELEVATE_TENANT_OWNER_OUTCOME.AMBIGUOUS_MEMBERSHIP,
      heading: OWNER_MEMBERSHIP_UNCLEAR,
    },
  ])(
    'never renders the owner-elevation row while the step is $stepStatus',
    ({ stepStatus, poll, outcome, heading }) => {
      setup({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        stepStatuses: [
          TENANT_PROVISIONING_STEP_STATUS.DONE,
          stepStatus,
          TENANT_PROVISIONING_STEP_STATUS.IDLE,
          TENANT_PROVISIONING_STEP_STATUS.IDLE,
          TENANT_PROVISIONING_STEP_STATUS.IDLE,
        ],
        ...poll,
        ownerElevationOutcome: outcome,
      });

      const elevationRow = screen.queryByText(heading);
      expect(elevationRow).not.toBeInTheDocument();
    },
  );
});
