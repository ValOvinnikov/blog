import { TENANT_PLAN } from '@blog/db';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import { makeTenant } from '@platform/testing/tenants/fixtures';

import { OwnerHomeView } from './owner-home-view';

const render = renderWithIntl;

describe(OwnerHomeView, () => {
  it("renders the tenant's name, status and plan, and an Open site action", () => {
    const tenant = makeTenant({
      name: 'Northwind Field Notes',
      primaryDomain: 'northwind.dev',
      plan: TENANT_PLAN.GROWTH,
    });
    render(
      <OwnerHomeView
        tenant={tenant}
        domainVerificationStatus="VERIFIED"
        ownerEmail="sam@northwind.dev"
        ownerJoinedAt="Aug 12, 2026"
        ownerJoinedAtIso="2026-08-12T00:00:00.000Z"
      />,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Northwind Field Notes' }),
    ).toBeVisible();
    expect(screen.getByText('Active')).toBeVisible();
    expect(screen.getAllByText('Growth').length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'Open site ↗' })).toHaveAttribute(
      'href',
      'https://northwind.dev',
    );
  });

  it('renders the read-only "Your site" card instead of an editable form', () => {
    const tenant = makeTenant({ name: 'Northwind Field Notes' });
    render(
      <OwnerHomeView
        tenant={tenant}
        domainVerificationStatus="VERIFIED"
        ownerEmail="sam@northwind.dev"
        ownerJoinedAt="Aug 12, 2026"
        ownerJoinedAtIso="2026-08-12T00:00:00.000Z"
      />,
    );

    expect(
      screen.getByRole('heading', { level: 2, name: 'Your site' }),
    ).toBeVisible();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it("renders Domain and Owner cards, linking DNS to the owner tree's own domain page", () => {
    const tenant = makeTenant({ id: 'tenant-1' });
    render(
      <OwnerHomeView
        tenant={tenant}
        domainVerificationStatus="PENDING"
        ownerEmail="sam@northwind.dev"
        ownerJoinedAt="Aug 12, 2026"
        ownerJoinedAtIso="2026-08-12T00:00:00.000Z"
      />,
    );

    expect(
      screen.getByRole('heading', { level: 2, name: 'Domain' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Owner' }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'DNS →' })).toHaveAttribute(
      'href',
      '/dashboard/domain',
    );
  });

  it('renders "Make it yours" tiles routing to the slug-free Look/Voice/Features pages', () => {
    render(
      <OwnerHomeView
        tenant={makeTenant()}
        domainVerificationStatus="VERIFIED"
        ownerEmail="sam@northwind.dev"
        ownerJoinedAt="Aug 12, 2026"
        ownerJoinedAtIso="2026-08-12T00:00:00.000Z"
      />,
    );

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

  it('never renders the platform-only Content workspace or Recent activity cards', () => {
    render(
      <OwnerHomeView
        tenant={makeTenant()}
        domainVerificationStatus="VERIFIED"
        ownerEmail="sam@northwind.dev"
        ownerJoinedAt="Aug 12, 2026"
        ownerJoinedAtIso="2026-08-12T00:00:00.000Z"
      />,
    );

    expect(
      screen.queryByRole('heading', { name: 'Content workspace' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Recent activity' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Open Studio ↗' }),
    ).not.toBeInTheDocument();
  });
});
