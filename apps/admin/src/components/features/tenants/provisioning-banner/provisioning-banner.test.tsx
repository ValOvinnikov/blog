import { renderWithIntl, screen } from '@admin/testing/custom-render';
import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db';

import { ProvisioningBanner } from './provisioning-banner';

const render = renderWithIntl;

// `ProvisioningBanner` only imports `STEP_ORDER` from
// `use-provisioning-poll`, but that module also imports these three Server
// Actions at the top level — mocked out purely so this render test doesn't
// transitively load the Auth.js chain behind them.
vi.mock('@admin/server/provisioning/retry-provisioning-step-action', () => ({
  retryProvisioningStepAction: vi.fn(),
}));

vi.mock(
  '@admin/server/provisioning/get-tenant-provisioning-status-action',
  () => ({
    getTenantProvisioningStatusAction: vi.fn(),
  }),
);

vi.mock(
  '@admin/server/provisioning/get-domain-verification-status-action',
  () => ({
    getDomainVerificationStatusAction: vi.fn(),
  }),
);

const idleStepStatuses = () =>
  Array(6).fill(TENANT_PROVISIONING_STEP_STATUS.IDLE);

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
      />,
    );

    expect(screen.getByText('Provisioning — step 3 of 6')).toBeVisible();
    expect(screen.getByRole('link', { name: 'View steps →' })).toHaveAttribute(
      'href',
      '/tenants/tenant-1/provisioning',
    );
  });

  it('shows the failed step and its classified error while stuck', () => {
    const stepStatuses = [
      TENANT_PROVISIONING_STEP_STATUS.DONE,
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
      />,
    );

    expect(
      screen.getByText('Provisioning failed at step 5 of 6'),
    ).toBeVisible();
    expect(
      screen.getByText(
        'Connect the custom domain — Already in use by another tenant',
      ),
    ).toBeVisible();
  });

  it('shows a one-line confirmation and a link to the steps when ready', () => {
    render(
      <ProvisioningBanner
        tenantId="tenant-1"
        provisioningStatus={TENANT_PROVISIONING_STATUS.READY}
        stepStatuses={Array(6).fill(TENANT_PROVISIONING_STEP_STATUS.DONE)}
        isOverallFailed={false}
        isProvisioningRunning={false}
        errorKind={undefined}
      />,
    );

    expect(screen.getByText('Provisioned')).toBeVisible();
    expect(screen.getByRole('link', { name: 'View steps →' })).toBeVisible();
  });
});
