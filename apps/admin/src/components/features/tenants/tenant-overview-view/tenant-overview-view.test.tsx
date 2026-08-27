import {
  act,
  renderWithIntl,
  screen,
  within,
} from '@admin/testing/custom-render';
import {
  idleProvisioningSteps,
  makeTenant,
} from '@admin/testing/tenants/fixtures';
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

const STEP_POLL_INTERVAL_MS = 4000;

const {
  retryProvisioningStepActionMock,
  getTenantProvisioningStatusActionMock,
} = vi.hoisted(() => ({
  retryProvisioningStepActionMock: vi.fn(),
  getTenantProvisioningStatusActionMock: vi.fn(),
}));

vi.mock('@admin/server/provisioning/retry-provisioning-step-action', () => ({
  retryProvisioningStepAction: retryProvisioningStepActionMock,
}));

vi.mock(
  '@admin/server/provisioning/get-tenant-provisioning-status-action',
  () => ({
    getTenantProvisioningStatusAction: getTenantProvisioningStatusActionMock,
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
  // Rendering a non-terminal `provisioningStatus` starts a real
  // `setInterval` poll loop that can outlive a test's own cleanup under
  // parallel load — faking setInterval/clearInterval closes that off, same
  // as `provisioning-status-view.test.tsx`.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    retryProvisioningStepActionMock.mockReset();
    retryProvisioningStepActionMock.mockResolvedValue({
      outcome: 'dispatched',
    });
    getTenantProvisioningStatusActionMock.mockReset();
    getTenantProvisioningStatusActionMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the tenant name and status/plan badges', () => {
    const tenant = makeTenant({ name: 'Acme Inc.', status: 'ACTIVE' });
    render(
      <TenantOverviewView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
        ownerJoinedAt="Aug 12, 2026"
        ownerJoinedAtIso="2026-08-12T00:00:00.000Z"
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

  it("nests every card's title one level under the page's own h1, with no h3 skip", () => {
    const tenant = makeTenant();
    render(
      <TenantOverviewView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
        ownerJoinedAt="Aug 12, 2026"
        ownerJoinedAtIso="2026-08-12T00:00:00.000Z"
        auditEvents={[]}
      />,
    );

    expect(
      screen.getByRole('heading', { level: 2, name: 'Tenant details' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Domain' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Owner' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Content workspace' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Recent activity' }),
    ).toBeVisible();
    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
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
        ownerJoinedAt="Aug 12, 2026"
        ownerJoinedAtIso="2026-08-12T00:00:00.000Z"
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
        ownerJoinedAt="Aug 12, 2026"
        ownerJoinedAtIso="2026-08-12T00:00:00.000Z"
        auditEvents={[]}
      />,
    );

    expect(screen.getByText('Tenant details')).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Slug' })).toHaveValue('acme');
  });

  it('locks every tenant details field while a step is running, stating why', () => {
    const tenant = makeTenant({
      provisioningSteps: {
        ...idleProvisioningSteps(),
        [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
        },
      },
    });
    render(
      <TenantOverviewView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
        ownerJoinedAt="Aug 12, 2026"
        ownerJoinedAtIso="2026-08-12T00:00:00.000Z"
        auditEvents={[]}
      />,
    );

    const slugInput = screen.getByRole('textbox', { name: 'Slug' });
    expect(slugInput).toBeDisabled();
    expect(slugInput).toHaveAccessibleDescription(
      'Locked while provisioning is running.',
    );
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  it('locks only the field a completed step already consumed once provisioning has FAILED, leaving the field that caused the failure editable', () => {
    // Mirrors the real 409 case: DEPLOY_STUDIO completed (locking slug), but
    // MAP_DOMAIN itself failed — so primaryDomain, the field that actually
    // caused the failure, stays editable.
    const tenant = makeTenant({
      primaryDomain: 'taken-domain.example.com',
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
          error: 'Vercel deploy failed: 409 domain_already_in_use',
        },
      },
    });
    render(
      <TenantOverviewView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
        ownerJoinedAt="Aug 12, 2026"
        ownerJoinedAtIso="2026-08-12T00:00:00.000Z"
        auditEvents={[]}
      />,
    );

    const slugInput = screen.getByRole('textbox', { name: 'Slug' });
    expect(slugInput).toBeDisabled();
    expect(slugInput).toHaveAccessibleDescription(
      'Locked — the "Deploy the content editor" step has already completed and used this value.',
    );

    const domainInput = screen.getByRole('textbox', {
      name: 'Primary domain',
    });
    expect(domainInput).not.toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Name' })).not.toBeDisabled();
  });

  it('locks every field immediately once a dispatch has begun, before any step has reported', () => {
    // Provisioning was just (re)started — `provisioningStatus` already
    // moved to PROVISIONING but every step is still IDLE, since a runner
    // hasn't picked the workflow up yet.
    const tenant = makeTenant({
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      provisioningSteps: idleProvisioningSteps(),
    });
    render(
      <TenantOverviewView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
        ownerJoinedAt="Aug 12, 2026"
        ownerJoinedAtIso="2026-08-12T00:00:00.000Z"
        auditEvents={[]}
      />,
    );

    expect(screen.getByRole('textbox', { name: 'Slug' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeDisabled();
    expect(
      screen.getByRole('textbox', { name: 'Primary domain' }),
    ).toBeDisabled();
  });

  it('keeps the provisioning banner and the details panel in sync off a single shared poll', async () => {
    const tenant = makeTenant({
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      provisioningSteps: {
        ...idleProvisioningSteps(),
        [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        },
        [TENANT_PROVISIONING_STEP.SEED_CONTENT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
        },
      },
    });
    getTenantProvisioningStatusActionMock.mockResolvedValue({
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
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
        ownerJoinedAt="Aug 12, 2026"
        ownerJoinedAtIso="2026-08-12T00:00:00.000Z"
        auditEvents={[]}
      />,
    );

    expect(screen.getByText('Provisioning — step 2 of 6')).toBeVisible();
    expect(
      screen.getByRole('textbox', { name: 'Slug' }),
    ).toHaveAccessibleDescription('Locked while provisioning is running.');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
    });

    // Both the banner and the details panel moved together off the same
    // poll tick — neither is left showing a stale RUNNING state while the
    // other has already caught up to READY/SUCCEEDED.
    expect(screen.getByText('Provisioned')).toBeVisible();
    expect(
      screen.getByRole('textbox', { name: 'Slug' }),
    ).toHaveAccessibleDescription(
      'Locked — provisioning has already finished.',
    );
  });

  it('shows the public domain and a link to the provisioning page for DNS', () => {
    const tenant = makeTenant({ primaryDomain: 'acme.example.com' });
    render(
      <TenantOverviewView
        tenant={tenant}
        domainVerificationStatus="VERIFIED"
        ownerEmail="owner@example.com"
        ownerJoinedAt="Aug 12, 2026"
        ownerJoinedAtIso="2026-08-12T00:00:00.000Z"
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
        ownerJoinedAt={undefined}
        ownerJoinedAtIso={undefined}
        auditEvents={[]}
      />,
    );

    expect(screen.getByText('Invited, pending')).toBeVisible();
    expect(screen.queryByText('Joined')).not.toBeInTheDocument();
  });

  it('shows the Joined row with the formatted date once the owner has a real membership', () => {
    const tenant = makeTenant();
    render(
      <TenantOverviewView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
        ownerJoinedAt="Aug 12, 2026"
        ownerJoinedAtIso="2026-08-12T00:00:00.000Z"
        auditEvents={[]}
      />,
    );

    expect(screen.getByText('Joined')).toBeVisible();
    const joinedTime = screen.getByText('Aug 12, 2026');
    expect(joinedTime).toBeVisible();
    expect(joinedTime.tagName).toBe('TIME');
    expect(joinedTime).toHaveAttribute('dateTime', '2026-08-12T00:00:00.000Z');
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
        ownerJoinedAt="Aug 12, 2026"
        ownerJoinedAtIso="2026-08-12T00:00:00.000Z"
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
        ownerJoinedAt="Aug 12, 2026"
        ownerJoinedAtIso="2026-08-12T00:00:00.000Z"
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
        ownerJoinedAt="Aug 12, 2026"
        ownerJoinedAtIso="2026-08-12T00:00:00.000Z"
        auditEvents={[]}
      />,
    );

    expect(screen.getByText('studio-northwind.valstack.dev')).toBeVisible();
  });

  it('renders recent activity events with actor email and a generic per-action label', () => {
    const tenant = makeTenant();
    const { container } = render(
      <TenantOverviewView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
        ownerJoinedAt="Aug 12, 2026"
        ownerJoinedAtIso="2026-08-12T00:00:00.000Z"
        auditEvents={[
          makeEvent({ action: AUDIT_ACTION.SETTINGS_UPDATED }),
          makeEvent({ id: 'event-2', action: AUDIT_ACTION.CREATED }),
        ]}
      />,
    );

    expect(screen.getByText('Settings updated')).toBeVisible();
    expect(screen.getByText('Tenant created')).toBeVisible();
    expect(screen.getAllByText('vo@valstack.dev')).toHaveLength(2);

    // Each relative timestamp is a real `<time>` element carrying the
    // lossless ISO instant, not just the lossy "2h ago"/"Aug 12" text.
    // Scoped by dateTime rather than a bare `container.querySelectorAll`
    // count, since the Owner card's own "Joined" `<time>` is also on this
    // page with a different `dateTime`.
    const activityTimeElements = Array.from(
      container.querySelectorAll('time'),
    ).filter(
      (element) =>
        element.getAttribute('dateTime') === '2026-08-24T12:00:00.000Z',
    );
    expect(activityTimeElements).toHaveLength(2);
  });

  it('shows an empty state when there is no recorded activity', () => {
    const tenant = makeTenant();
    render(
      <TenantOverviewView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
        ownerJoinedAt="Aug 12, 2026"
        ownerJoinedAtIso="2026-08-12T00:00:00.000Z"
        auditEvents={[]}
      />,
    );

    expect(screen.getByText('No activity recorded yet.')).toBeVisible();
  });
});
