import { renderWithIntl, screen } from '@admin/testing/custom-render';
import {
  idleProvisioningSteps,
  makeTenant,
} from '@admin/testing/tenants/fixtures';
import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db';

import { ProvisioningBanner } from './provisioning-banner';

const render = renderWithIntl;

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

describe(ProvisioningBanner, () => {
  it('renders nothing for a tenant that has not started provisioning', () => {
    const tenant = makeTenant({
      provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
      provisioningSteps: idleProvisioningSteps(),
    });

    const { container } = render(
      <ProvisioningBanner
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('shows the current step and a link to the provisioning page while running', () => {
    const tenant = makeTenant({
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      provisioningSteps: {
        ...idleProvisioningSteps(),
        [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        },
        [TENANT_PROVISIONING_STEP.SEED_CONTENT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        },
        [TENANT_PROVISIONING_STEP.DEPLOY_STUDIO]: {
          status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
        },
      },
    });

    render(
      <ProvisioningBanner
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
      />,
    );

    expect(screen.getByText('Provisioning — step 3 of 6')).toBeVisible();
    expect(screen.getByRole('link', { name: 'View steps →' })).toHaveAttribute(
      'href',
      `/tenants/${tenant.id}/provisioning`,
    );
  });

  it('shows the failed step and its classified error while stuck', () => {
    const tenant = makeTenant({
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      provisioningSteps: {
        ...idleProvisioningSteps(),
        [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        },
        [TENANT_PROVISIONING_STEP.SEED_CONTENT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        },
        [TENANT_PROVISIONING_STEP.DEPLOY_STUDIO]: {
          status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        },
        [TENANT_PROVISIONING_STEP.PERSIST_TOKEN]: {
          status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        },
        [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: {
          status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
          error: 'Vercel Domains API failed: 400 domain already in use',
        },
      },
    });

    render(
      <ProvisioningBanner
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
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
    const tenant = makeTenant({
      provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
      provisioningSteps: Object.fromEntries(
        Object.values(TENANT_PROVISIONING_STEP).map((step) => [
          step,
          { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        ]),
      ) as ReturnType<typeof idleProvisioningSteps>,
    });

    render(
      <ProvisioningBanner
        tenant={tenant}
        domainVerificationStatus="VERIFIED"
      />,
    );

    expect(screen.getByText('Provisioned')).toBeVisible();
    expect(screen.getByRole('link', { name: 'View steps →' })).toBeVisible();
  });
});
