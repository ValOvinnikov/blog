import { DOMAIN_VERIFICATION_STATUS } from '@platform/constants/domain';
import messages from '@platform/i18n/messages/en.json';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
  mockJoinedOwner,
  mockTenant,
} from '@platform/testing/tenants/fixtures';

import TenantOverviewPage from './page';

const {
  requireTenantByIdMock,
  requireAdminMock,
  getTenantOwnerMembershipMock,
  listAuditEventsForTargetMock,
  listFindingsForTenantMock,
  getDomainVerificationStatusMock,
} = vi.hoisted(() => ({
  requireTenantByIdMock: vi.fn(),
  requireAdminMock: vi.fn(),
  getTenantOwnerMembershipMock: vi.fn(),
  listAuditEventsForTargetMock: vi.fn(),
  listFindingsForTenantMock: vi.fn(),
  getDomainVerificationStatusMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-tenant-by-id', () => ({
  requireTenantById: requireTenantByIdMock,
}));

vi.mock('@platform/server/auth/require-admin', () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock('@platform/server/tenants/resolve-is-platform-tenant');

vi.mock('@platform/server/tenants/tenant-suspension-actions', () => ({
  suspendTenantAction: vi.fn(),
  liftTenantSuspensionAction: vi.fn(),
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

vi.mock('@platform/server/provisioning/retry-provisioning-step-action');

vi.mock('@platform/server/provisioning/get-tenant-provisioning-status-action');

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

const { tenantOverviewPage } = messages;

const setup = customRenderAsync(TenantOverviewPage, {
  params: Promise.resolve({ tenantId: MOCK_TENANT_ID }),
});

describe(`<${TenantOverviewPage.name}/>`, () => {
  beforeEach(() => {
    requireTenantByIdMock.mockResolvedValue({ tenant: mockTenant() });
    requireAdminMock.mockResolvedValue(mockAdmin());
    getTenantOwnerMembershipMock.mockResolvedValue(mockJoinedOwner());
    listAuditEventsForTargetMock.mockResolvedValue([]);
    listFindingsForTenantMock.mockResolvedValue([]);
    getDomainVerificationStatusMock.mockResolvedValue(
      DOMAIN_VERIFICATION_STATUS.NOT_CONFIGURED,
    );
  });

  it('renders the overview of the requested tenant', async () => {
    await setup();

    const heading = screen.getByRole('heading', {
      level: 1,
      name: MOCK_TENANT_NAME,
    });

    expect(requireTenantByIdMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(heading).toBeVisible();
  });

  it('renders the overview without waiting for the Vercel domain status', async () => {
    getDomainVerificationStatusMock.mockReturnValueOnce(new Promise(() => {}));

    await setup();

    const pageHeading = screen.getByRole('heading', {
      level: 1,
      name: MOCK_TENANT_NAME,
    });
    const ownerHeading = screen.getByRole('heading', {
      level: 2,
      name: tenantOverviewPage.ownerCardTitle,
    });
    const domainHeading = screen.queryByRole('heading', {
      level: 2,
      name: tenantOverviewPage.domainCardTitle,
    });
    const [domainSkeleton] = screen.getAllByTestId('skeleton');

    expect(pageHeading).toBeVisible();
    expect(ownerHeading).toBeVisible();
    expect(domainHeading).not.toBeInTheDocument();
    expect(domainSkeleton).toBeVisible();
  });
});
