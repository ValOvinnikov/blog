import { TENANT_PLAN } from '@blog/db';
import {
  DOMAIN_VERIFICATION_STATUS,
  type TDomainVerificationStatus,
} from '@platform/constants/domain';
import { act, customRender, screen } from '@platform/testing/custom-render';
import { makeTenant } from '@platform/testing/tenants/fixtures';

import { OwnerHomeView, type TOwnerHomeViewProps } from './owner-home-view';

vi.mock('@platform/server/provisioning/retry-provisioning-step-action');

vi.mock('@platform/server/provisioning/get-tenant-provisioning-status-action');

const defaultProps: TOwnerHomeViewProps = {
  tenant: makeTenant(),
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
  it("renders the tenant's name, status and plan, and an Open site action", async () => {
    const tenant = makeTenant({
      name: 'Northwind Field Notes',
      primaryDomain: 'northwind.dev',
      plan: TENANT_PLAN.GROWTH,
    });
    await setup({ tenant: tenant });

    const northwindFieldNotesHeading = screen.getByRole('heading', {
      level: 1,
      name: 'Northwind Field Notes',
    });
    const activeText = screen.getByText('Active');
    const growthCount = screen.getAllByText('Growth').length;
    const openSiteOpensInLink = screen.getByRole('link', {
      name: 'Open site (opens in new tab)',
    });

    expect(northwindFieldNotesHeading).toBeVisible();
    expect(activeText).toBeVisible();
    expect(growthCount).toBeGreaterThan(0);
    expect(openSiteOpensInLink).toHaveAttribute(
      'href',
      'https://northwind.dev',
    );
  });

  it('renders the archived notice when the tenant has been deprovisioned', async () => {
    const tenant = makeTenant({
      name: 'Northwind Field Notes',
      deprovisionedAt: new Date('2026-08-26T00:00:00.000Z'),
    });
    await setup({ tenant: tenant });

    const thisTenantIsText = screen.getByText('This tenant is archived');

    expect(thisTenantIsText).toBeVisible();
  });

  it('does not render the archived notice for a non-archived tenant', async () => {
    const tenant = makeTenant({
      name: 'Northwind Field Notes',
      deprovisionedAt: null,
    });
    await setup({ tenant: tenant });

    const thisTenantIsText = screen.queryByText('This tenant is archived');

    expect(thisTenantIsText).not.toBeInTheDocument();
  });

  it('renders the read-only "Your site" card instead of an editable form', async () => {
    const tenant = makeTenant({ name: 'Northwind Field Notes' });
    await setup({ tenant: tenant });

    const yourSiteHeading = screen.getByRole('heading', {
      level: 2,
      name: 'Your site',
    });
    const textbox = screen.queryByRole('textbox');

    expect(yourSiteHeading).toBeVisible();
    expect(textbox).not.toBeInTheDocument();
  });

  it("renders Domain and Owner cards, linking DNS to the owner tree's own domain page", async () => {
    const tenant = makeTenant({ id: 'tenant-1' });
    await setup({
      tenant: tenant,
      domainVerificationStatus: Promise.resolve(
        DOMAIN_VERIFICATION_STATUS.PENDING,
      ),
    });

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
    expect(dnsLink).toHaveAttribute('href', '/dashboard/domain');
  });

  it('renders "Make it yours" tiles routing to the Look/Voice/Features dashboard pages', async () => {
    await setup({ tenant: makeTenant() });

    const makeItYoursHeading = screen.getByRole('heading', {
      level: 2,
      name: 'Make it yours',
    });
    const lookLink = screen.getByRole('link', { name: /Look/ });
    const voiceLink = screen.getByRole('link', { name: /Voice/ });
    const featuresLink = screen.getByRole('link', { name: /Features/ });

    expect(makeItYoursHeading).toBeVisible();
    expect(lookLink).toHaveAttribute('href', '/dashboard/look');
    expect(voiceLink).toHaveAttribute('href', '/dashboard/voice');
    expect(featuresLink).toHaveAttribute('href', '/dashboard/features');
  });

  it('never renders the platform-only Content workspace or Recent activity cards', async () => {
    await setup({ tenant: makeTenant() });

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

  it('renders the page around a Domain card skeleton while Vercel has not answered', async () => {
    await setup({
      tenant: makeTenant({ name: 'Northwind Field Notes' }),
      domainVerificationStatus: new Promise<TDomainVerificationStatus>(
        () => {},
      ),
    });

    const northwindFieldNotesHeading = screen.getByRole('heading', {
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
    const skeletonCount = screen.getAllByTestId('skeleton').length;

    expect(northwindFieldNotesHeading).toBeVisible();
    expect(ownerHeading).toBeVisible();
    expect(domainHeading).toBeNull();
    expect(skeletonCount).toBeGreaterThan(0);
  });

  it('replaces the skeleton with the streamed domain status', async () => {
    await setup({
      domainVerificationStatus: Promise.resolve(
        DOMAIN_VERIFICATION_STATUS.PENDING,
      ),
    });

    const pendingAwaitingDnsText = screen.getByText('Pending — awaiting DNS');
    const skeleton = screen.queryByTestId('skeleton');

    expect(pendingAwaitingDnsText).toBeVisible();
    expect(skeleton).toBeNull();
  });
});
