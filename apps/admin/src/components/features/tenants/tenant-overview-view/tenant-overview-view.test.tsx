import { renderWithIntl, screen, within } from '@admin/testing/custom-render';
import { makeTenant } from '@admin/testing/tenants/fixtures';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db';
import type { TAuditEvent } from '@blog/db/schema/audit-events';
import type { TTenantProvisioningSteps } from '@blog/db/schema/tenants';

import { TenantOverviewView } from './tenant-overview-view';

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

vi.mock('@admin/server/tenants/update-tenant-details-action', () => ({
  updateTenantDetailsAction: vi.fn(),
}));

const makeEvent = (overrides: Partial<TAuditEvent> = {}): TAuditEvent => ({
  id: 'event-1',
  actorId: 'user-1',
  actorEmail: 'vo@valstack.dev',
  action: AUDIT_ACTION.CREATED,
  targetType: AUDIT_TARGET_TYPE.TENANT,
  targetId: 'tenant-1',
  details: null,
  createdAt: new Date('2026-08-24T12:00:00.000Z'),
  ...overrides,
});

describe(TenantOverviewView, () => {
  it('renders the tenant name and status/plan badges', () => {
    const tenant = makeTenant({ name: 'Acme Inc.', status: 'ACTIVE' });
    render(
      <TenantOverviewView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
        auditEvents={[]}
      />,
    );

    const heading = screen.getByRole('heading', {
      level: 1,
      name: 'Acme Inc.',
    });
    expect(heading).toBeVisible();
    // Scoped to the heading's own row — `TenantDetailsPanel`'s plan
    // segmented control on this same page also has a "Free" option.
    const titleRow = heading.parentElement as HTMLElement;
    expect(within(titleRow).getByText('Active')).toBeVisible();
    expect(within(titleRow).getByText('Free')).toBeVisible();
  });

  it('renders the provisioning banner', () => {
    const tenant = makeTenant({
      provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
      provisioningSteps: Object.fromEntries(
        Object.values(TENANT_PROVISIONING_STEP).map((step) => [
          step,
          { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        ]),
      ) as TTenantProvisioningSteps,
    });
    render(
      <TenantOverviewView
        tenant={tenant}
        domainVerificationStatus="VERIFIED"
        ownerEmail="owner@example.com"
        auditEvents={[]}
      />,
    );

    expect(screen.getByText('Provisioned')).toBeVisible();
  });

  it('relocates the tenant details panel here as the Identity card', () => {
    const tenant = makeTenant({ slug: 'acme' });
    render(
      <TenantOverviewView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
        auditEvents={[]}
      />,
    );

    expect(screen.getByText('Tenant details')).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Slug' })).toHaveValue('acme');
  });

  it('shows the public domain and a link to the provisioning page for DNS', () => {
    const tenant = makeTenant({ primaryDomain: 'acme.example.com' });
    render(
      <TenantOverviewView
        tenant={tenant}
        domainVerificationStatus="VERIFIED"
        ownerEmail="owner@example.com"
        auditEvents={[]}
      />,
    );

    expect(screen.getByText('acme.example.com')).toBeVisible();
    expect(screen.getByRole('link', { name: 'DNS →' })).toHaveAttribute(
      'href',
      `/tenants/${tenant.id}/provisioning`,
    );
  });

  it('shows the invited-pending badge when the owner has no resolved email', () => {
    const tenant = makeTenant();
    render(
      <TenantOverviewView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail={undefined}
        auditEvents={[]}
      />,
    );

    expect(screen.getByText('Invited, pending')).toBeVisible();
  });

  it("shows 'Not set' for content-workspace fields the tenant has not been provisioned with yet", () => {
    const tenant = makeTenant({
      sanityProjectId: null,
      sanityDataset: null,
      sanityReadTokenEncrypted: null,
      webhookCreatedAt: null,
    });
    render(
      <TenantOverviewView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
        auditEvents={[]}
      />,
    );

    const notSetTexts = screen.getAllByText('Not set');
    expect(notSetTexts.length).toBeGreaterThan(0);
  });

  it('shows Stored/Active badges once the token and webhook exist', () => {
    // `status: 'SUSPENDED'` here only to avoid colliding with the page
    // header's own tenant-status badge, which also reads "Active" by
    // default — unrelated to what this test is checking.
    const tenant = makeTenant({
      status: 'SUSPENDED',
      sanityProjectId: 'proj-1',
      sanityDataset: 'production',
      sanityReadTokenEncrypted: 'encrypted-value',
      webhookCreatedAt: new Date('2026-04-02T00:00:00.000Z'),
    });
    render(
      <TenantOverviewView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
        auditEvents={[]}
      />,
    );

    expect(screen.getByText('Stored')).toBeVisible();
    expect(screen.getByText('Active')).toBeVisible();
    expect(screen.getByText('proj-1')).toBeVisible();
  });

  it('renders the studio hostname derived from the tenant slug', () => {
    const tenant = makeTenant({ slug: 'northwind' });
    render(
      <TenantOverviewView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
        auditEvents={[]}
      />,
    );

    expect(screen.getByText('studio-northwind.valstack.dev')).toBeVisible();
  });

  it('renders recent activity events with actor email and a generic per-action label', () => {
    const tenant = makeTenant();
    render(
      <TenantOverviewView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
        auditEvents={[
          makeEvent({ action: AUDIT_ACTION.SETTINGS_UPDATED }),
          makeEvent({ id: 'event-2', action: AUDIT_ACTION.CREATED }),
        ]}
      />,
    );

    expect(screen.getByText('Settings updated')).toBeVisible();
    expect(screen.getByText('Tenant created')).toBeVisible();
    expect(screen.getAllByText('vo@valstack.dev')).toHaveLength(2);
  });

  it('shows an empty state when there is no recorded activity', () => {
    const tenant = makeTenant();
    render(
      <TenantOverviewView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
        auditEvents={[]}
      />,
    );

    expect(screen.getByText('No activity recorded yet.')).toBeVisible();
  });
});
