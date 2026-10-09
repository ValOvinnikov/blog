import { AUDIT_TARGET_TYPE, DOMAIN_VERIFICATION_STATUS } from '@blog/config';
import {
  FINDING_KIND,
  FINDING_SEVERITY,
  FINDING_SOURCE,
  FINDING_STATUS,
} from '@blog/config/constants';
import type { TFindingSummary } from '@blog/db/schema/findings';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { makeTenant } from '@platform/testing/tenants/fixtures';

import TenantOverviewPage from './page';

const makeFinding = (
  overrides: Partial<TFindingSummary> = {},
): TFindingSummary => ({
  id: 'finding-1',
  tenantId: 'tenant-1',
  source: FINDING_SOURCE.TENANT_PROVISIONING,
  kind: FINDING_KIND.PROVISIONING_STEP_FAILED,
  severity: FINDING_SEVERITY.CRITICAL,
  status: FINDING_STATUS.OPEN,
  dedupeKey: 'dedupe-1',
  hasDetails: false,
  firstSeenAt: new Date('2026-04-01T00:00:00.000Z'),
  lastSeenAt: new Date('2026-04-02T00:00:00.000Z'),
  resolvedAt: null,
  ...overrides,
});

const {
  listTenantsByIdsMock,
  getTenantOwnerEmailMock,
  getTenantOwnerMembershipMock,
  listAuditEventsForTargetMock,
  listFindingsForTenantMock,
  getDomainVerificationStatusMock,
} = vi.hoisted(() => ({
  listTenantsByIdsMock: vi.fn(),
  getTenantOwnerEmailMock: vi.fn(),
  getTenantOwnerMembershipMock: vi.fn(),
  listAuditEventsForTargetMock: vi.fn(),
  listFindingsForTenantMock: vi.fn(),
  getDomainVerificationStatusMock: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    tenants: { listTenantsByIds: listTenantsByIdsMock },
    memberships: {
      getTenantOwnerEmail: getTenantOwnerEmailMock,
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
    listTenantsByIdsMock.mockReset();
    tenant = makeTenant();
    listTenantsByIdsMock.mockResolvedValue([tenant]);
    getTenantOwnerEmailMock.mockReset();
    getTenantOwnerEmailMock.mockResolvedValue('owner@example.com');
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

    expect(listTenantsByIdsMock).toHaveBeenCalledWith(['tenant-1']);
    expect(getTenantOwnerEmailMock).toHaveBeenCalledWith(tenant.id);
    expect(getTenantOwnerMembershipMock).toHaveBeenCalledWith(tenant.id);
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

  it('formats and passes the owner membership join date to the Joined row', async () => {
    await setup();

    expect(screen.getByText('Joined')).toBeVisible();
    const joinedTime = screen.getByText('Aug 12, 2026');
    expect(joinedTime).toBeVisible();
    expect(joinedTime).toHaveAttribute('dateTime', '2026-08-12T00:00:00.000Z');
  });

  it('omits the Joined row when the owner is still a pending invite', async () => {
    getTenantOwnerEmailMock.mockResolvedValue(undefined);
    getTenantOwnerMembershipMock.mockResolvedValue(undefined);

    await setup();

    expect(screen.queryByText('Joined')).not.toBeInTheDocument();
    expect(screen.getByText('Invited, pending')).toBeVisible();
  });

  it('404s for an unknown tenant id', async () => {
    listTenantsByIdsMock.mockResolvedValue([]);

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('always shows "Open site", pointing at the tenant\'s live domain', async () => {
    listTenantsByIdsMock.mockResolvedValue([
      makeTenant({ primaryDomain: 'acme.example.com' }),
    ]);

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
});
