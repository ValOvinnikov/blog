import { TENANT_PLAN } from '@blog/db/constants';
import {
  DOMAIN_VERIFICATION_STATUS,
  type TDomainVerificationStatus,
} from '@platform/constants/domain';
import {
  act,
  customRender,
  screen,
  within,
} from '@platform/testing/custom-render';
import { ARCHIVED_NOTICE_TEXT } from '@platform/testing/render-in-settings-form';
import {
  mockTenant,
  MOCK_ARCHIVED_AT,
  MOCK_CUSTOM_DOMAIN,
  MOCK_CUSTOM_DOMAIN_URL,
  MOCK_SITE_NAME,
  mockJoinedOwner,
} from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';

import { OwnerHomeView, type TOwnerHomeViewProps } from './owner-home-view';

vi.mock('@platform/server/provisioning/retry-provisioning-step-action');

vi.mock('@platform/server/provisioning/get-tenant-provisioning-status-action');

const tenant = mockTenant({
  name: MOCK_SITE_NAME,
  primaryDomain: MOCK_CUSTOM_DOMAIN,
  plan: TENANT_PLAN.GROWTH,
});

const defaultProps: TOwnerHomeViewProps = {
  tenant,
  domainVerificationStatus: Promise.resolve(
    DOMAIN_VERIFICATION_STATUS.VERIFIED,
  ),
  owner: mockJoinedOwner(),
};

const renderView = customRender(OwnerHomeView, defaultProps);

const setup = async (overrides?: Partial<TOwnerHomeViewProps>) => {
  await act(async () => {
    renderView(overrides);
  });
};

describe(`<${OwnerHomeView.name}/>`, () => {
  describe('for a live tenant', () => {
    beforeEach(async () => {
      await setup();
    });

    it("shows the tenant's name, status and plan, and an Open site link", () => {
      const tenantHeading = screen.getByRole('heading', {
        level: 1,
        name: MOCK_SITE_NAME,
      });
      const statusText = screen.getByText('Active');
      const titleRow = screen.getByTestId('page-header-title-row');
      const planText = within(titleRow).getByText('Growth');
      const openSiteLink = screen.getByRole('link', {
        name: 'Open site (opens in new tab)',
      });

      expect(tenantHeading).toBeVisible();
      expect(statusText).toBeVisible();
      expect(planText).toBeVisible();
      expect(openSiteLink).toHaveAttribute('href', MOCK_CUSTOM_DOMAIN_URL);
    });

    it('shows no archived notice', () => {
      const archivedNotice = screen.queryByText(ARCHIVED_NOTICE_TEXT);

      expect(archivedNotice).not.toBeInTheDocument();
    });

    it('shows the read-only Your site card instead of an editable form', () => {
      const yourSiteHeading = screen.getByRole('heading', {
        level: 2,
        name: 'Your site',
      });
      const textbox = screen.queryByRole('textbox');

      expect(yourSiteHeading).toBeVisible();
      expect(textbox).not.toBeInTheDocument();
    });

    it('shows the Make it yours card', () => {
      const makeItYoursHeading = screen.getByRole('heading', {
        level: 2,
        name: 'Make it yours',
      });

      expect(makeItYoursHeading).toBeVisible();
    });

    it('omits the platform-only Content workspace and Recent activity cards', () => {
      const contentWorkspaceHeading = screen.queryByRole('heading', {
        name: 'Content workspace',
      });
      const recentActivityHeading = screen.queryByRole('heading', {
        name: 'Recent activity',
      });
      const openStudioLink = screen.queryByRole('link', {
        name: 'Open Studio →',
      });

      expect(contentWorkspaceHeading).not.toBeInTheDocument();
      expect(recentActivityHeading).not.toBeInTheDocument();
      expect(openStudioLink).not.toBeInTheDocument();
    });
  });

  it('shows the archived notice when the tenant has been deprovisioned', async () => {
    await setup({
      tenant: {
        ...tenant,
        deprovisionedAt: MOCK_ARCHIVED_AT,
      },
    });

    const archivedNotice = screen.getByText(ARCHIVED_NOTICE_TEXT);

    expect(archivedNotice).toBeVisible();
  });

  describe('with a pending domain', () => {
    beforeEach(async () => {
      await setup({
        domainVerificationStatus: Promise.resolve(
          DOMAIN_VERIFICATION_STATUS.PENDING,
        ),
      });
    });

    it('shows the Domain and Owner cards, linking DNS to the domain page', () => {
      const domainHeading = screen.getByRole('heading', {
        level: 2,
        name: 'Domain',
      });
      const ownerHeading = screen.getByRole('heading', {
        level: 2,
        name: 'Owner',
      });
      const dnsLink = screen.getByRole('link', { name: 'DNS' });

      expect(domainHeading).toBeVisible();
      expect(ownerHeading).toBeVisible();
      expect(dnsLink).toHaveAttribute('href', adminRoutes.dashboardDomain());
    });

    it('replaces the skeleton with the streamed domain status', () => {
      const pendingStatusText = screen.getByText('Pending — awaiting DNS');
      const skeleton = screen.queryByTestId('skeleton');

      expect(pendingStatusText).toBeVisible();
      expect(skeleton).not.toBeInTheDocument();
    });
  });

  it('shows a Domain card skeleton while Vercel has not answered', async () => {
    await setup({
      domainVerificationStatus: new Promise<TDomainVerificationStatus>(
        () => {},
      ),
    });

    const tenantHeading = screen.getByRole('heading', {
      level: 1,
      name: MOCK_SITE_NAME,
    });
    const ownerHeading = screen.getByRole('heading', {
      level: 2,
      name: 'Owner',
    });
    const domainHeading = screen.queryByRole('heading', {
      level: 2,
      name: 'Domain',
    });
    const skeletons = screen.getAllByTestId('skeleton');

    expect(tenantHeading).toBeVisible();
    expect(ownerHeading).toBeVisible();
    expect(domainHeading).not.toBeInTheDocument();
    expect(skeletons).not.toHaveLength(0);
  });
});
