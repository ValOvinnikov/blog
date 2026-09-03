import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db';
import { renderWithIntl, screen } from '@platform/testing/custom-render';

import { ProvisioningBanner } from './provisioning-banner';

const render = renderWithIntl;

// `ProvisioningBanner` only imports `STEP_ORDER` from
// `use-provisioning-poll`, but that module also imports these three Server
// Actions at the top level — mocked out purely so this render test doesn't
// transitively load the Auth.js chain behind them.
vi.mock('@platform/server/provisioning/retry-provisioning-step-action', () => ({
  retryProvisioningStepAction: vi.fn(),
}));

vi.mock(
  '@platform/server/provisioning/get-tenant-provisioning-status-action',
  () => ({
    getTenantProvisioningStatusAction: vi.fn(),
  }),
);

vi.mock(
  '@platform/server/provisioning/get-domain-verification-status-action',
  () => ({
    getDomainVerificationStatusAction: vi.fn(),
  }),
);

const idleStepStatuses = () =>
  Array(5).fill(TENANT_PROVISIONING_STEP_STATUS.IDLE);

describe(ProvisioningBanner, () => {
  it('renders nothing for a tenant that has not started provisioning', () => {
    render(
      <ProvisioningBanner
        tenantId="tenant-1"
        provisioningStatus={TENANT_PROVISIONING_STATUS.PENDING}
        stepStatuses={idleStepStatuses()}
        isOverallFailed={false}
        isProvisioningRunning={false}
        errorKind={undefined}
        ownerElevationOutcome={undefined}
      />,
    );

    // The shared render wrapper always mounts an (empty) toast viewport, so
    // the container itself is never fully empty — assert the banner's own
    // possible outputs are absent instead.
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('shows the current step and a link to the provisioning page while running', () => {
    const stepStatuses = [
      TENANT_PROVISIONING_STEP_STATUS.DONE,
      TENANT_PROVISIONING_STEP_STATUS.DONE,
      TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      TENANT_PROVISIONING_STEP_STATUS.IDLE,
      TENANT_PROVISIONING_STEP_STATUS.IDLE,
    ];

    render(
      <ProvisioningBanner
        tenantId="tenant-1"
        provisioningStatus={TENANT_PROVISIONING_STATUS.PROVISIONING}
        stepStatuses={stepStatuses}
        isOverallFailed={false}
        isProvisioningRunning={true}
        errorKind={undefined}
        ownerElevationOutcome={undefined}
      />,
    );

    expect(screen.getByText('Provisioning — step 3 of 5')).toBeVisible();
    expect(screen.getByRole('link', { name: 'View steps' })).toHaveAttribute(
      'href',
      '/tenants/tenant-1/provisioning',
    );
  });

  it('shows the failed step and its classified error while stuck', () => {
    const stepStatuses = [
      TENANT_PROVISIONING_STEP_STATUS.DONE,
      TENANT_PROVISIONING_STEP_STATUS.DONE,
      TENANT_PROVISIONING_STEP_STATUS.DONE,
      TENANT_PROVISIONING_STEP_STATUS.FAILED,
      TENANT_PROVISIONING_STEP_STATUS.IDLE,
    ];

    render(
      <ProvisioningBanner
        tenantId="tenant-1"
        provisioningStatus={TENANT_PROVISIONING_STATUS.PROVISIONING}
        stepStatuses={stepStatuses}
        isOverallFailed={true}
        isProvisioningRunning={false}
        errorKind="duplicate"
        ownerElevationOutcome={undefined}
      />,
    );

    expect(
      screen.getByText('Provisioning failed at step 4 of 5'),
    ).toBeVisible();
    expect(
      screen.getByText('Connect domain — Already in use by another tenant'),
    ).toBeVisible();
  });

  it('shows a one-line confirmation and a link to the steps when ready', () => {
    render(
      <ProvisioningBanner
        tenantId="tenant-1"
        provisioningStatus={TENANT_PROVISIONING_STATUS.READY}
        stepStatuses={Array(5).fill(TENANT_PROVISIONING_STEP_STATUS.DONE)}
        isOverallFailed={false}
        isProvisioningRunning={false}
        errorKind={undefined}
        ownerElevationOutcome={undefined}
      />,
    );

    expect(screen.getByText('Provisioned')).toBeVisible();
    expect(screen.getByRole('link', { name: 'View steps' })).toBeVisible();
  });

  it('shows a status-role owner-elevation row for a STALLED outcome when ready', () => {
    render(
      <ProvisioningBanner
        tenantId="tenant-1"
        provisioningStatus={TENANT_PROVISIONING_STATUS.READY}
        stepStatuses={Array(5).fill(TENANT_PROVISIONING_STEP_STATUS.DONE)}
        isOverallFailed={false}
        isProvisioningRunning={false}
        errorKind={undefined}
        ownerElevationOutcome="STALLED"
      />,
    );

    expect(screen.getByText('Owner invite stalled')).toBeVisible();
    expect(
      screen.getByText(
        "The owner hasn't accepted their invite yet — nothing failed, but they can't edit their own content until they do.",
      ),
    ).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getAllByRole('status')).toHaveLength(2);
  });

  it('shows a status-role owner-elevation row for an AMBIGUOUS_MEMBERSHIP outcome when ready', () => {
    render(
      <ProvisioningBanner
        tenantId="tenant-1"
        provisioningStatus={TENANT_PROVISIONING_STATUS.READY}
        stepStatuses={Array(5).fill(TENANT_PROVISIONING_STEP_STATUS.DONE)}
        isOverallFailed={false}
        isProvisioningRunning={false}
        errorKind={undefined}
        ownerElevationOutcome="AMBIGUOUS_MEMBERSHIP"
      />,
    );

    expect(screen.getByText('Owner membership unclear')).toBeVisible();
    expect(
      screen.getByText(
        "More than one membership matches this tenant's owner — resolve it manually in Sanity Manage.",
      ),
    ).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getAllByRole('status')).toHaveLength(2);
  });

  it.each(['ELEVATED', 'ALREADY_ADMINISTRATOR', 'PENDING_ACCEPTANCE'] as const)(
    'renders nothing extra for a %s outcome when ready',
    (outcome) => {
      render(
        <ProvisioningBanner
          tenantId="tenant-1"
          provisioningStatus={TENANT_PROVISIONING_STATUS.READY}
          stepStatuses={Array(5).fill(TENANT_PROVISIONING_STEP_STATUS.DONE)}
          isOverallFailed={false}
          isProvisioningRunning={false}
          errorKind={undefined}
          ownerElevationOutcome={outcome}
        />,
      );

      expect(screen.getByText('Provisioned')).toBeVisible();
      // Only the "ready" banner's own status role — no owner-elevation row.
      expect(screen.getAllByRole('status')).toHaveLength(1);
    },
  );

  it('never renders the owner-elevation row while provisioning is still running, regardless of outcome', () => {
    const stepStatuses = [
      TENANT_PROVISIONING_STEP_STATUS.DONE,
      TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      TENANT_PROVISIONING_STEP_STATUS.IDLE,
      TENANT_PROVISIONING_STEP_STATUS.IDLE,
      TENANT_PROVISIONING_STEP_STATUS.IDLE,
    ];

    render(
      <ProvisioningBanner
        tenantId="tenant-1"
        provisioningStatus={TENANT_PROVISIONING_STATUS.PROVISIONING}
        stepStatuses={stepStatuses}
        isOverallFailed={false}
        isProvisioningRunning={true}
        errorKind={undefined}
        ownerElevationOutcome="STALLED"
      />,
    );

    expect(screen.queryByText('Owner invite stalled')).not.toBeInTheDocument();
  });

  it('never renders the owner-elevation row while provisioning has failed, regardless of outcome', () => {
    const stepStatuses = [
      TENANT_PROVISIONING_STEP_STATUS.DONE,
      TENANT_PROVISIONING_STEP_STATUS.FAILED,
      TENANT_PROVISIONING_STEP_STATUS.IDLE,
      TENANT_PROVISIONING_STEP_STATUS.IDLE,
      TENANT_PROVISIONING_STEP_STATUS.IDLE,
    ];

    render(
      <ProvisioningBanner
        tenantId="tenant-1"
        provisioningStatus={TENANT_PROVISIONING_STATUS.PROVISIONING}
        stepStatuses={stepStatuses}
        isOverallFailed={true}
        isProvisioningRunning={false}
        errorKind="duplicate"
        ownerElevationOutcome="AMBIGUOUS_MEMBERSHIP"
      />,
    );

    expect(
      screen.queryByText('Owner membership unclear'),
    ).not.toBeInTheDocument();
  });
});
