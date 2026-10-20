import { AUDIT_TARGET_TYPE } from '@blog/config';
import { ADMIN_ROLE } from '@blog/db/constants';
import { DOMAIN_VERIFICATION_STATUS } from '@platform/constants/domain';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { makeFinding } from '@platform/testing/findings/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { makeTenant } from '@platform/testing/tenants/fixtures';

import TenantOverviewPage from './page';

const {
  requireTenantByIdMock,
  getTenantOwnerMembershipMock,
  listAuditEventsForTargetMock,
  listFindingsForTenantMock,
  getDomainVerificationStatusMock,
} = vi.hoisted(() => ({
  requireTenantByIdMock: vi.fn(),
  getTenantOwnerMembershipMock: vi.fn(),
  listAuditEventsForTargetMock: vi.fn(),
  listFindingsForTenantMock: vi.fn(),
  getDomainVerificationStatusMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-tenant-by-id', () => ({
  requireTenantById: requireTenantByIdMock,
}));

vi.mock('@platform/server/auth/require-admin', () => ({
  requireAdmin: vi.fn(async () => ({
    id: 'admin-1',
    role: ADMIN_ROLE.ADMIN,
  })),
}));

vi.mock('@platform/server/tenants/tenant-suspension-actions', () => ({
  suspendTenantAction: vi.fn(),
  liftTenantSuspensionAction: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    memberships: {
      getTenantOwnerMembership: getTenantOwnerMembershipMock,
    },
    auditEvents: { listAuditEventsForTarget: listAuditEventsForTargetMock },
    findings: { listFindingsForTenant: listFindingsForTenantMock },
  },
}));

vi.mock('@platform/server/provisioning/get-domain-verification-status', () => ({
  getDomainVerificationStatus: getDomainVerificationStatusMock,
}));

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

vi.mock('@platform/server/findings/get-finding-details-action', () => ({
  getFindingDetailsAction: vi.fn(),
}));

vi.mock('@platform/server/tenants/update-tenant-details-action', () => ({
  updateTenantDetailsAction: vi.fn(),
}));

const setup = customRenderAsync(TenantOverviewPage, {
  params: Promise.resolve({ tenantId: 'tenant-1' }),
});

describe(TenantOverviewPage, () => {
  let tenant: ReturnType<typeof makeTenant>;

  beforeEach(() => {
    requireTenantByIdMock.mockReset();
    tenant = makeTenant();
    requireTenantByIdMock.mockResolvedValue({ tenant: tenant });
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

  it('renders the overview for the resolved tenant', async () => {
    await setup();

    expect(requireTenantByIdMock).toHaveBeenCalledWith('tenant-1');
    expect(getTenantOwnerMembershipMock).toHaveBeenCalledExactlyOnceWith(
      tenant.id,
    );
    expect(getDomainVerificationStatusMock).toHaveBeenCalledWith(
      'acme.example.com',
    );
    expect(listAuditEventsForTargetMock).toHaveBeenCalledWith(
      AUDIT_TARGET_TYPE.TENANT,
      tenant.id,
      { limit: 5 },
    );
    expect(listFindingsForTenantMock).toHaveBeenCalledWith(tenant.id, 'OPEN');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Acme Inc.' }),
    ).toBeVisible();
  });

  it('shows the owner membership join date in the Joined row', async () => {
    await setup();

    expect(screen.getByText('Joined')).toBeVisible();
    const joinedTime = screen.getByText('Aug 12, 2026');
    expect(joinedTime).toBeVisible();
    expect(joinedTime).toHaveAttribute('dateTime', '2026-08-12T00:00:00.000Z');
  });

  it('shows the invited email without a Joined row when the owner is still a pending invite', async () => {
    getTenantOwnerMembershipMock.mockResolvedValue({
      email: 'invited@example.com',
    });

    await setup();

    expect(screen.queryByText('Joined')).not.toBeInTheDocument();
    expect(screen.getByText('invited@example.com')).toBeVisible();
  });

  it('shows the invited-pending badge when the tenant has no owner', async () => {
    getTenantOwnerMembershipMock.mockResolvedValue(undefined);

    await setup();

    expect(screen.getByText('Invited, pending')).toBeVisible();
  });

  it('always shows "Open site", pointing at the tenant\'s live domain', async () => {
    requireTenantByIdMock.mockResolvedValue({
      tenant: makeTenant({ primaryDomain: 'acme.example.com' }),
    });

    await setup();

    expect(
      screen.getByRole('link', { name: 'Open site (opens in new tab)' }),
    ).toHaveAttribute('href', 'https://acme.example.com');
  });

  it('never shows an "Open Studio" action — the sidebar is the only entry point to Studio', async () => {
    await setup();

    expect(
      screen.queryByRole('link', { name: 'Open Studio →' }),
    ).not.toBeInTheDocument();
  });

  it("renders the tenant's open findings from listFindingsForTenant", async () => {
    listFindingsForTenantMock.mockResolvedValue([makeFinding()]);

    await setup();

    expect(screen.getByText('Provisioning step failed')).toBeVisible();
  });

  it('shows the healthy empty state when the tenant has no open findings', async () => {
    listFindingsForTenantMock.mockResolvedValue([]);

    await setup();

    expect(
      screen.getByText(
        "No open findings for this tenant — everything's healthy.",
      ),
    ).toBeVisible();
  });

  it('renders the overview without waiting for the Vercel domain status', async () => {
    getDomainVerificationStatusMock.mockReturnValue(new Promise(() => {}));

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Acme Inc.' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Owner' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Recent activity' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('heading', { level: 2, name: 'Domain' }),
    ).toBeNull();
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });
});
