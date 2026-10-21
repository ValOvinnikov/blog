import { TENANT_PLAN } from '@blog/db';
import {
  DOMAIN_VERIFICATION_STATUS,
  type TDomainVerificationStatus,
} from '@platform/constants/domain';
import { act, customRender, screen } from '@platform/testing/custom-render';
import { makeTenant } from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';

import { OwnerHomeView, type TOwnerHomeViewProps } from './owner-home-view';

vi.mock('@platform/server/provisioning/retry-provisioning-step-action');

vi.mock('@platform/server/provisioning/get-tenant-provisioning-status-action');

const tenant = makeTenant({
  name: 'Northwind Field Notes',
  primaryDomain: 'northwind.dev',
  plan: TENANT_PLAN.GROWTH,
});

const defaultProps: TOwnerHomeViewProps = {
  tenant,
  domainVerificationStatus: Promise.resolve(
    DOMAIN_VERIFICATION_STATUS.VERIFIED,
  ),
  owner: {
    email: 'sam@northwind.dev',
    joinedAt: new Date('2026-08-12T00:00:00.000Z'),
  },
};

const renderView = customRender(OwnerHomeView, defaultProps);

const setup = async (overrides?: Partial<TOwnerHomeViewProps>) => {
  await act(async () => {
    renderView(overrides);
  });
};

describe(OwnerHomeView, () => {
  describe('for a live tenant', () => {
    beforeEach(async () => {
      await setup();
    });

    it("renders the tenant's name, status and plan, and an Open site action", () => {
      const tenantHeading = screen.getByRole('heading', {
        level: 1,
        name: 'Northwind Field Notes',
      });
      const statusText = screen.getByText('Active');
      const planTexts = screen.getAllByText('Growth');
      const openSiteLink = screen.getByRole('link', {
        name: 'Open site (opens in new tab)',
      });

      expect(tenantHeading).toBeVisible();
      expect(statusText).toBeVisible();
      expect(planTexts.length).toBeGreaterThan(0);
      expect(openSiteLink).toHaveAttribute('href', 'https://northwind.dev');
    });

    it('does not render the archived notice', () => {
      const archivedNotice = screen.queryByText('This tenant is archived');

      expect(archivedNotice).not.toBeInTheDocument();
    });

    it('renders the read-only "Your site" card instead of an editable form', () => {
      const yourSiteHeading = screen.getByRole('heading', {
        level: 2,
        name: 'Your site',
      });
      const textbox = screen.queryByRole('textbox');

      expect(yourSiteHeading).toBeVisible();
      expect(textbox).not.toBeInTheDocument();
    });

    it('renders "Make it yours" tiles routing to the Look/Voice/Features dashboard pages', () => {
      const makeItYoursHeading = screen.getByRole('heading', {
        level: 2,
        name: 'Make it yours',
      });
      const lookLink = screen.getByRole('link', { name: /Look/ });
      const voiceLink = screen.getByRole('link', { name: /Voice/ });
      const featuresLink = screen.getByRole('link', { name: /Features/ });

      expect(makeItYoursHeading).toBeVisible();
      expect(lookLink).toHaveAttribute('href', adminRoutes.dashboardLook());
      expect(voiceLink).toHaveAttribute('href', adminRoutes.dashboardVoice());
      expect(featuresLink).toHaveAttribute(
        'href',
        adminRoutes.dashboardFeatures(),
      );
    });

    it('never renders the platform-only Content workspace or Recent activity cards', () => {
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

  it('renders the archived notice when the tenant has been deprovisioned', async () => {
    await setup({
      tenant: {
        ...tenant,
        deprovisionedAt: new Date('2026-08-26T00:00:00.000Z'),
      },
    });

    const archivedNotice = screen.getByText('This tenant is archived');

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

    it("renders Domain and Owner cards, linking DNS to the owner tree's own domain page", () => {
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
      expect(skeleton).toBeNull();
    });
  });

  it('renders the page around a Domain card skeleton while Vercel has not answered', async () => {
    await setup({
      domainVerificationStatus: new Promise<TDomainVerificationStatus>(
        () => {},
      ),
    });

    const tenantHeading = screen.getByRole('heading', {
      level: 1,
      name: 'Northwind Field Notes',
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
    expect(domainHeading).toBeNull();
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
