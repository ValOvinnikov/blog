import { renderWithIntl, screen } from '@admin/testing/custom-render';
import { makeTenant } from '@admin/testing/tenants/fixtures';

import { DomainPageContent } from './domain-page-content';

const render = renderWithIntl;

describe(DomainPageContent, () => {
  it("renders the tenant's domain as the page heading, with a live status badge", () => {
    const tenant = makeTenant({ primaryDomain: 'northwind.dev' });
    render(
      <DomainPageContent
        tenant={tenant}
        domainVerificationStatus="PENDING"
        dnsRecords={[{ type: 'A', name: '@', value: '76.76.21.21' }]}
      />,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'northwind.dev' }),
    ).toBeVisible();
    expect(screen.getByText('Awaiting DNS')).toBeVisible();
  });

  it('renders the DNS records table when pending with known records', () => {
    const tenant = makeTenant({ primaryDomain: 'northwind.dev' });
    render(
      <DomainPageContent
        tenant={tenant}
        domainVerificationStatus="PENDING"
        dnsRecords={[
          { type: 'A', name: '@', value: '76.76.21.21' },
          { type: 'CNAME', name: 'www', value: 'cname.vercel-dns.com' },
        ]}
      />,
    );

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Point northwind.dev at us',
      }),
    ).toBeVisible();
    expect(screen.getByRole('table')).toBeVisible();
    expect(screen.getByText('76.76.21.21')).toBeVisible();
    expect(screen.getByText('cname.vercel-dns.com')).toBeVisible();
  });

  it('shows the verified empty state instead of the table once verified', () => {
    const tenant = makeTenant({ primaryDomain: 'northwind.dev' });
    render(
      <DomainPageContent
        tenant={tenant}
        domainVerificationStatus="VERIFIED"
        dnsRecords={undefined}
      />,
    );

    expect(screen.getByText('Verified')).toBeVisible();
    expect(
      screen.getByText(
        "This domain is verified — there's nothing left to configure.",
      ),
    ).toBeVisible();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('shows a graceful fallback when pending but the records are unknown', () => {
    const tenant = makeTenant({ primaryDomain: 'northwind.dev' });
    render(
      <DomainPageContent
        tenant={tenant}
        domainVerificationStatus="PENDING"
        dnsRecords={undefined}
      />,
    );

    expect(
      screen.getByText("DNS records aren't available right now."),
    ).toBeVisible();
    expect(screen.queryByRole('table')).toBeNull();
  });
});
