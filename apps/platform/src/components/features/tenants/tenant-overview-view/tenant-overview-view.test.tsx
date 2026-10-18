import { ACTION_OUTCOME, AUDIT_TARGET_TYPE } from '@blog/config';
import { FINDING_STATUS } from '@blog/config/constants';
import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import type { TTenantProvisioningState } from '@blog/db/schema/tenants';
import { DOMAIN_VERIFICATION_STATUS } from '@platform/constants/domain';
import { makeAuditEvent } from '@platform/testing/audit-events/fixtures';
import {
  act,
  renderWithIntl,
  screen,
  within,
} from '@platform/testing/custom-render';
import { makeFinding } from '@platform/testing/findings/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  idleProvisioningSteps,
  makeTenant,
} from '@platform/testing/tenants/fixtures';

import { TenantOverviewView } from './tenant-overview-view';

const STEP_POLL_INTERVAL_MS = 4000;

const {
  retryProvisioningStepActionMock,
  getTenantProvisioningStatusActionMock,
  getTenantOwnerMembershipMock,
  listAuditEventsForTargetMock,
  listFindingsForTenantMock,
  getDomainVerificationStatusMock,
} = vi.hoisted(() => ({
  retryProvisioningStepActionMock: vi.fn(),
  getTenantProvisioningStatusActionMock: vi.fn(),
  getTenantOwnerMembershipMock: vi.fn(),
  listAuditEventsForTargetMock: vi.fn(),
  listFindingsForTenantMock: vi.fn(),
  getDomainVerificationStatusMock: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    memberships: { getTenantOwnerMembership: getTenantOwnerMembershipMock },
    auditEvents: { listAuditEventsForTarget: listAuditEventsForTargetMock },
    findings: { listFindingsForTenant: listFindingsForTenantMock },
  },
}));

vi.mock('@platform/server/provisioning/get-domain-verification-status', () => ({
  getDomainVerificationStatus: getDomainVerificationStatusMock,
}));

vi.mock(
  '@platform/server/provisioning/get-domain-verification-status-action',
  () => ({
    getDomainVerificationStatusAction: vi.fn(),
  }),
);

vi.mock('@platform/server/provisioning/retry-provisioning-step-action', () => ({
  retryProvisioningStepAction: retryProvisioningStepActionMock,
}));

vi.mock(
  '@platform/server/provisioning/get-tenant-provisioning-status-action',
  () => ({
    getTenantProvisioningStatusAction: getTenantProvisioningStatusActionMock,
  }),
);

vi.mock('@platform/server/findings/get-finding-details-action', () => ({
  getFindingDetailsAction: vi.fn(),
}));

vi.mock('@platform/server/tenants/update-tenant-details-action', () => ({
  updateTenantDetailsAction: vi.fn(),
}));

const setup = async ({ tenant = makeTenant() } = {}) => {
  const ui = await TenantOverviewView({ tenant });
  await act(async () => {
    renderWithIntl(ui);
  });
};

describe(`<${TenantOverviewView.name}/>`, () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    retryProvisioningStepActionMock.mockReset();
    retryProvisioningStepActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    getTenantProvisioningStatusActionMock.mockReset();
    getTenantProvisioningStatusActionMock.mockResolvedValue(undefined);
    getTenantOwnerMembershipMock.mockReset();
    getTenantOwnerMembershipMock.mockResolvedValue({
      email: 'owner@example.com',
      joinedAt: new Date('2026-08-12T00:00:00.000Z'),
    });
    listAuditEventsForTargetMock.mockReset();
    listAuditEventsForTargetMock.mockResolvedValue([]);
    listFindingsForTenantMock.mockReset();
    listFindingsForTenantMock.mockResolvedValue([]);
    getDomainVerificationStatusMock.mockReset();
    getDomainVerificationStatusMock.mockResolvedValue(
      DOMAIN_VERIFICATION_STATUS.NOT_CONFIGURED,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the tenant name and status/plan badges', async () => {
    await setup({
      tenant: makeTenant({ name: 'Acme Inc.', status: 'ACTIVE' }),
    });

    const heading = screen.getByRole('heading', {
      level: 1,
      name: 'Acme Inc.',
    });
    expect(heading).toBeVisible();
    const titleRow = heading.parentElement as HTMLElement;
    expect(within(titleRow).getByText('Active')).toBeVisible();
    expect(within(titleRow).getByText('Free')).toBeVisible();
  });

  it("nests every card's title one level under the page's own h1, with no h3 skip", async () => {
    await setup();

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
    expect(
      screen.getByRole('heading', { level: 2, name: 'Open findings' }),
    ).toBeVisible();
    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
  });

  it('renders the provisioning banner', async () => {
    await setup({
      tenant: makeTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
        provisioningSteps: Object.fromEntries(
          Object.values(TENANT_PROVISIONING_STEP).map((step) => [
            step,
            { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
          ]),
        ) as unknown as TTenantProvisioningState,
      }),
    });

    expect(screen.getByText('Provisioned')).toBeVisible();
  });

  it('relocates the tenant details panel here as the Identity card', async () => {
    await setup({ tenant: makeTenant({ name: 'Acme Inc.' }) });

    expect(screen.getByText('Tenant details')).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue(
      'Acme Inc.',
    );
  });

  it('locks every tenant details field while a step is running, stating why', async () => {
    await setup({
      tenant: makeTenant({
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
          },
        },
      }),
    });

    const nameInput = screen.getByRole('textbox', { name: 'Name' });
    expect(nameInput).toBeDisabled();
    expect(nameInput).toHaveAccessibleDescription(
      'Locked while provisioning is running.',
    );
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  it('locks primaryDomain once MAP_DOMAIN has completed and a later step failed, leaving the field that caused the failure editable', async () => {
    await setup({
      tenant: makeTenant({
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
      }),
    });

    const domainInput = screen.getByRole('textbox', {
      name: 'Primary domain',
    });
    expect(domainInput).toBeDisabled();
    expect(domainInput).toHaveAccessibleDescription(
      'Locked — the "Connect domain" step has already completed and used this value.',
    );

    expect(screen.getByRole('textbox', { name: 'Name' })).not.toBeDisabled();
  });

  it('locks every field immediately once a dispatch has begun, before any step has reported', async () => {
    await setup({
      tenant: makeTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: idleProvisioningSteps(),
      }),
    });

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
      ) as unknown as TTenantProvisioningState,
    });

    await setup({ tenant });

    expect(screen.getByText('Provisioning — step 2 of 6')).toBeVisible();
    expect(
      screen.getByRole('textbox', { name: 'Name' }),
    ).toHaveAccessibleDescription('Locked while provisioning is running.');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
    });

    expect(screen.getByText('Provisioned')).toBeVisible();
    expect(
      screen.getByRole('textbox', { name: 'Name' }),
    ).toHaveAccessibleDescription(
      'Locked — provisioning has already finished.',
    );
  });

  it("fills each fact card from the tenant's own owner, activity, findings and domain status", async () => {
    getDomainVerificationStatusMock.mockResolvedValue(
      DOMAIN_VERIFICATION_STATUS.VERIFIED,
    );
    listAuditEventsForTargetMock.mockResolvedValue([makeAuditEvent()]);
    listFindingsForTenantMock.mockResolvedValue([makeFinding()]);

    await setup({
      tenant: makeTenant({
        id: 'tenant-1',
        primaryDomain: 'acme.example.com',
        sanityProjectId: 'proj-1',
      }),
    });

    expect(getTenantOwnerMembershipMock).toHaveBeenCalledExactlyOnceWith(
      'tenant-1',
    );
    expect(listAuditEventsForTargetMock).toHaveBeenCalledWith(
      AUDIT_TARGET_TYPE.TENANT,
      'tenant-1',
      { limit: 5 },
    );
    expect(listFindingsForTenantMock).toHaveBeenCalledWith(
      'tenant-1',
      FINDING_STATUS.OPEN,
    );
    expect(getDomainVerificationStatusMock).toHaveBeenCalledWith(
      'acme.example.com',
    );
    expect(screen.getByText('Verified')).toBeVisible();
    expect(screen.getByText('Aug 12, 2026')).toBeVisible();
    expect(screen.getByText('proj-1')).toBeVisible();
    expect(screen.getByText('vo@valstack.dev')).toBeVisible();
    expect(screen.getByText('Provisioning step failed')).toBeVisible();
  });

  it('shows the invited owner email in both the owner card and the details panel while the owner is a pending invite', async () => {
    getTenantOwnerMembershipMock.mockResolvedValue({
      email: 'invited@example.com',
    });

    await setup();

    expect(screen.getByText('invited@example.com')).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Owner email' })).toHaveValue(
      'invited@example.com',
    );
    expect(screen.queryByText('Joined')).not.toBeInTheDocument();
  });

  it('always renders "Open site", linking to the tenant\'s live domain', async () => {
    await setup({ tenant: makeTenant({ primaryDomain: 'acme.example.com' }) });

    const link = screen.getByRole('link', {
      name: 'Open site (opens in new tab)',
    });
    expect(link).toHaveAttribute('href', 'https://acme.example.com');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('never renders an "Open Studio" action — the sidebar is the only entry point to Studio', async () => {
    await setup();

    expect(
      screen.queryByRole('link', { name: 'Open Studio →' }),
    ).not.toBeInTheDocument();
  });

  describe('archived tenant', () => {
    const archivedTenant = makeTenant({
      deprovisionedAt: new Date('2026-08-26T00:00:00.000Z'),
    });

    beforeEach(async () => {
      await setup({ tenant: archivedTenant });
    });

    it('shows the archived notice', async () => {
      expect(screen.getByText('This tenant is archived')).toBeVisible();
    });

    it("describes the details panel's disabled Save button with the archived notice, end to end", async () => {
      expect(
        screen.getByRole('button', { name: 'Save changes' }),
      ).toHaveAccessibleDescription(/This tenant is archived/);
    });
  });

  it('does not show the archived notice for a live tenant', async () => {
    await setup({ tenant: makeTenant({ deprovisionedAt: null }) });

    expect(
      screen.queryByText('This tenant is archived'),
    ).not.toBeInTheDocument();
  });
});
