import { TENANT_PLAN } from '@blog/db';
import {
  DOMAIN_VERIFICATION_STATUS,
  type TDomainVerificationStatus,
} from '@platform/constants/domain';
import { act, customRender, screen } from '@platform/testing/custom-render';
import { makeTenant } from '@platform/testing/tenants/fixtures';

import { OwnerHomeView, type TOwnerHomeViewProps } from './owner-home-view';

const defaultProps: TOwnerHomeViewProps = {
  tenant: makeTenant(),
  domainVerificationStatus: Promise.resolve(
    DOMAIN_VERIFICATION_STATUS.VERIFIED,
  ),
  ownerEmail: 'sam@northwind.dev',
  ownerJoinedAt: 'Aug 12, 2026',
  ownerJoinedAtIso: '2026-08-12T00:00:00.000Z',
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

    expect(
      screen.getByRole('heading', { level: 1, name: 'Northwind Field Notes' }),
    ).toBeVisible();
    expect(screen.getByText('Active')).toBeVisible();
    expect(screen.getAllByText('Growth').length).toBeGreaterThan(0);
    expect(
      screen.getByRole('link', { name: 'Open site (opens in new tab)' }),
    ).toHaveAttribute('href', 'https://northwind.dev');
  });

  it('renders the archived notice when the tenant has been deprovisioned', async () => {
    const tenant = makeTenant({
      name: 'Northwind Field Notes',
      deprovisionedAt: new Date('2026-08-26T00:00:00.000Z'),
    });
    await setup({ tenant: tenant });

    expect(screen.getByText('This tenant is archived')).toBeVisible();
  });

  it('does not render the archived notice for a non-archived tenant', async () => {
    const tenant = makeTenant({
      name: 'Northwind Field Notes',
      deprovisionedAt: null,
    });
    await setup({ tenant: tenant });

    expect(
      screen.queryByText('This tenant is archived'),
    ).not.toBeInTheDocument();
  });

  it('renders the read-only "Your site" card instead of an editable form', async () => {
    const tenant = makeTenant({ name: 'Northwind Field Notes' });
    await setup({ tenant: tenant });

    expect(
      screen.getByRole('heading', { level: 2, name: 'Your site' }),
    ).toBeVisible();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it("renders Domain and Owner cards, linking DNS to the owner tree's own domain page", async () => {
    const tenant = makeTenant({ id: 'tenant-1' });
    await setup({
      tenant: tenant,
      domainVerificationStatus: Promise.resolve(
        DOMAIN_VERIFICATION_STATUS.PENDING,
      ),
    });

    expect(
      screen.getByRole('heading', { level: 2, name: 'Domain' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Owner' }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'DNS' })).toHaveAttribute(
      'href',
      '/dashboard/domain',
    );
  });

  it('renders "Make it yours" tiles routing to the Look/Voice/Features dashboard pages', async () => {
    await setup({ tenant: makeTenant() });

    expect(
      screen.getByRole('heading', { level: 2, name: 'Make it yours' }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: /Look/ })).toHaveAttribute(
      'href',
      '/dashboard/look',
    );
    expect(screen.getByRole('link', { name: /Voice/ })).toHaveAttribute(
      'href',
      '/dashboard/voice',
    );
    expect(screen.getByRole('link', { name: /Features/ })).toHaveAttribute(
      'href',
      '/dashboard/features',
    );
  });

  it('never renders the platform-only Content workspace or Recent activity cards', async () => {
    await setup({ tenant: makeTenant() });

    expect(
      screen.queryByRole('heading', { name: 'Content workspace' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Recent activity' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Open Studio →' }),
    ).not.toBeInTheDocument();
  });

  it('renders the page around a Domain card skeleton while Vercel has not answered', async () => {
    await setup({
      tenant: makeTenant({ name: 'Northwind Field Notes' }),
      domainVerificationStatus: new Promise<TDomainVerificationStatus>(
        () => {},
      ),
    });

    expect(
      screen.getByRole('heading', { level: 1, name: 'Northwind Field Notes' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Owner' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('heading', { level: 2, name: 'Domain' }),
    ).toBeNull();
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });

  it('replaces the skeleton with the streamed domain status', async () => {
    await setup({
      domainVerificationStatus: Promise.resolve(
        DOMAIN_VERIFICATION_STATUS.PENDING,
      ),
    });

    expect(screen.getByText('Pending — awaiting DNS')).toBeVisible();
    expect(screen.queryByTestId('skeleton')).toBeNull();
  });
});
