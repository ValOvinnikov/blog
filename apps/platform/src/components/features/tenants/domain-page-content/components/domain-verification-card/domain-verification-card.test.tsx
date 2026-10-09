import type { TProjectDomain } from '@platform/server/provisioning/vercel-domains-api';
import { act, renderWithIntl, screen } from '@platform/testing/custom-render';

import { DomainVerificationCard } from './domain-verification-card';

const render = (projectDomain: TProjectDomain) =>
  act(async () => {
    renderWithIntl(
      <DomainVerificationCard
        domain="northwind.dev"
        projectDomain={Promise.resolve(projectDomain)}
      />,
    );
  });

describe(DomainVerificationCard, () => {
  it('shows the status badge in the card header beside the domain', async () => {
    await render({ status: 'PENDING', dnsRecords: [] });

    const heading = await screen.findByRole('heading', {
      level: 2,
      name: 'Point northwind.dev at us',
    });
    expect(heading).toBeVisible();
    expect(screen.getByText('Awaiting DNS')).toBeVisible();
    expect(screen.getByText('Checked just now')).toBeVisible();
    expect(heading.textContent).not.toContain('Awaiting DNS');
  });

  it('renders the DNS records table when pending with known records', async () => {
    await render({
      status: 'PENDING',
      dnsRecords: [
        { type: 'A', name: '@', value: '76.76.21.21' },
        { type: 'CNAME', name: 'www', value: 'cname.vercel-dns.com' },
      ],
    });

    expect(await screen.findByRole('table')).toBeVisible();
    expect(screen.getByText('76.76.21.21')).toBeVisible();
    expect(screen.getByText('cname.vercel-dns.com')).toBeVisible();
  });

  it('shows the verified empty state instead of the table once verified', async () => {
    await render({ status: 'VERIFIED', dnsRecords: [] });

    expect(await screen.findByText('Verified')).toBeVisible();
    expect(
      screen.getByText(
        "This domain is verified — there's nothing left to configure.",
      ),
    ).toBeVisible();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it.each([
    ['PENDING', 'Awaiting DNS'],
    ['NOT_ADDED', 'Not added yet'],
    ['ERROR', "Couldn't check"],
    ['NOT_CONFIGURED', 'Unavailable'],
  ] as const)(
    'shows the %s badge and the records fallback when no records are known',
    async (status, badge) => {
      await render({ status, dnsRecords: [] });

      expect(await screen.findByText(badge)).toBeVisible();
      expect(
        screen.getByText("DNS records aren't available right now."),
      ).toBeVisible();
      expect(screen.queryByRole('table')).toBeNull();
    },
  );
});
