import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db';
import type { TAuditEvent } from '@blog/db/schema/audit-events';
import type { TTenantProvisioningSteps } from '@blog/db/schema/tenants';
import {
  act,
  renderWithIntl,
  screen,
  within,
} from '@platform/testing/custom-render';
import {
  idleProvisioningSteps,
  makeTenant,
} from '@platform/testing/tenants/fixtures';

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

vi.mock('@platform/server/provisioning/retry-provisioning-step-action', () => ({
  retryProvisioningStepAction: retryProvisioningStepActionMock,
}));

vi.mock(
  '@platform/server/provisioning/get-tenant-provisioning-status-action',
  () => ({
    getTenantProvisioningStatusAction: getTenantProvisioningStatusActionMock,
  }),
);

vi.mock(
  '@platform/server/provisioning/get-domain-verification-status-action',
  () => ({
    getDomainVerificationStatusAction: vi.fn(),
  }),
);

vi.mock('@platform/server/tenants/update-tenant-details-action', () => ({
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
        isSuperAdmin={false}
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
        isSuperAdmin={false}
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
        isSuperAdmin={false}
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
        isSuperAdmin={false}
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
        isSuperAdmin={false}
      />,
    );

    const slugInput = screen.getByRole('textbox', { name: 'Slug' });
    expect(slugInput).toBeDisabled();
    expect(slugInput).toHaveAccessibleDescription(
      'Locked while provisioning is running.',
    );
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  it('locks primaryDomain once MAP_DOMAIN has completed and a later step failed, leaving the field that caused the failure editable', () => {
    const tenant = makeTenant({
      provisioningSteps: {
        ...idleProvisioningSteps(),
        [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        },
        [TENANT_PROVISIONING_STEP.SEED_CONTENT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        },
        [TENANT_PROVISIONING_STEP.PERSIST_TOKEN]: {
          status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        },
        [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: {
          status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        },
        [TENANT_PROVISIONING_STEP.CREATE_WEBHOOK]: {
          status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
          error: 'boom',
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
        isSuperAdmin={false}
      />,
    );

    const domainInput = screen.getByRole('textbox', {
      name: 'Primary domain',
    });
    expect(domainInput).toBeDisabled();
    expect(domainInput).toHaveAccessibleDescription(
      'Locked — the "Connect the custom domain" step has already completed and used this value.',
    );

    expect(screen.getByRole('textbox', { name: 'Slug' })).not.toBeDisabled();
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
        isSuperAdmin={false}
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
        isSuperAdmin={false}
      />,
    );

    expect(screen.getByText('Provisioning — step 2 of 5')).toBeVisible();
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

  it('wires each of the four fact cards with the data passed into the view', () => {
    // Each card's own rendering is covered by its own co-located test —
    // this only confirms `TenantOverviewView` actually threads the right
    // prop through to each one.
    const tenant = makeTenant({
      primaryDomain: 'acme.example.com',
      sanityProjectId: 'proj-1',
    });
    render(
      <TenantOverviewView
        tenant={tenant}
        domainVerificationStatus="VERIFIED"
        ownerEmail="owner@example.com"
        ownerJoinedAt="Aug 12, 2026"
        ownerJoinedAtIso="2026-08-12T00:00:00.000Z"
        auditEvents={[makeEvent()]}
        isSuperAdmin={false}
      />,
    );

    expect(screen.getByText('acme.example.com')).toBeVisible();
    expect(screen.getByText('Aug 12, 2026')).toBeVisible();
    expect(screen.getByText('proj-1')).toBeVisible();
    expect(screen.getByText('vo@valstack.dev')).toBeVisible();
  });

  it('always renders "Open site", linking to the tenant\'s live domain', () => {
    const tenant = makeTenant({ primaryDomain: 'acme.example.com' });
    render(
      <TenantOverviewView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
        ownerJoinedAt="Aug 12, 2026"
        ownerJoinedAtIso="2026-08-12T00:00:00.000Z"
        auditEvents={[]}
        isSuperAdmin={false}
      />,
    );

    const link = screen.getByRole('link', { name: 'Open site ↗' });
    expect(link).toHaveAttribute('href', 'https://acme.example.com');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('renders "Open Studio", linking to the tenant\'s Studio host, only for a super admin', () => {
    const tenant = makeTenant({ slug: 'acme' });
    render(
      <TenantOverviewView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
        ownerJoinedAt="Aug 12, 2026"
        ownerJoinedAtIso="2026-08-12T00:00:00.000Z"
        auditEvents={[]}
        isSuperAdmin={true}
      />,
    );

    expect(screen.getByRole('link', { name: 'Open Studio ↗' })).toHaveAttribute(
      'href',
      'https://studio-acme.valstack.dev',
    );
  });

  it('omits "Open Studio" for a non-super-admin viewer', () => {
    const tenant = makeTenant({ slug: 'acme' });
    render(
      <TenantOverviewView
        tenant={tenant}
        domainVerificationStatus="NOT_CONFIGURED"
        ownerEmail="owner@example.com"
        ownerJoinedAt="Aug 12, 2026"
        ownerJoinedAtIso="2026-08-12T00:00:00.000Z"
        auditEvents={[]}
        isSuperAdmin={false}
      />,
    );

    expect(
      screen.queryByRole('link', { name: 'Open Studio ↗' }),
    ).not.toBeInTheDocument();
  });
});
