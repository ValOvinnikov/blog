import { DOMAIN_VERIFICATION_STATUS } from '@platform/constants/domain';
import type { TProjectDomain } from '@platform/server/provisioning/vercel-domains-api';
import { act, renderWithIntl, screen } from '@platform/testing/custom-render';
import { MOCK_CUSTOM_DOMAIN } from '@platform/testing/tenants/fixtures';

import { DomainVerificationCard } from './domain-verification-card';

const AWAITING_DNS = 'Awaiting DNS';
const CHECKED_JUST_NOW = 'Checked just now';
const A_RECORD_VALUE = '76.76.21.21';
const CNAME_RECORD_VALUE = 'cname.vercel-dns.com';

const render = (projectDomain: TProjectDomain) =>
  act(async () => {
    renderWithIntl(
      <DomainVerificationCard
        domain={MOCK_CUSTOM_DOMAIN}
        projectDomain={Promise.resolve(projectDomain)}
      />,
    );
  });

describe(`<${DomainVerificationCard.name}/>`, () => {
  it('shows the status badge in the card header beside the domain', async () => {
    await render({
      status: DOMAIN_VERIFICATION_STATUS.PENDING,
      dnsRecords: [],
    });

    const heading = await screen.findByRole('heading', {
      level: 2,
      name: `Point ${MOCK_CUSTOM_DOMAIN} at us`,
    });
    expect(heading).toBeVisible();
    expect(screen.getByText(AWAITING_DNS)).toBeVisible();
    expect(screen.getByText(CHECKED_JUST_NOW)).toBeVisible();
    expect(heading.textContent).not.toContain(AWAITING_DNS);
  });

  it('renders the DNS records table when pending with known records', async () => {
    await render({
      status: DOMAIN_VERIFICATION_STATUS.PENDING,
      dnsRecords: [
        { type: 'A', name: '@', value: A_RECORD_VALUE },
        { type: 'CNAME', name: 'www', value: CNAME_RECORD_VALUE },
      ],
    });

    expect(await screen.findByRole('table')).toBeVisible();
    expect(screen.getByText(A_RECORD_VALUE)).toBeVisible();
    expect(screen.getByText(CNAME_RECORD_VALUE)).toBeVisible();
  });

  it('shows the verified empty state instead of the table once verified', async () => {
    await render({
      status: DOMAIN_VERIFICATION_STATUS.VERIFIED,
      dnsRecords: [],
    });

    expect(await screen.findByText('Verified')).toBeVisible();
    expect(
      screen.getByText(
        "This domain is verified — there's nothing left to configure.",
      ),
    ).toBeVisible();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('titles a verified domain as connected', async () => {
    await render({
      status: DOMAIN_VERIFICATION_STATUS.VERIFIED,
      dnsRecords: [],
    });

    expect(
      await screen.findByRole('heading', {
        level: 2,
        name: `${MOCK_CUSTOM_DOMAIN} is connected`,
      }),
    ).toBeVisible();
  });

  it('asks for the records only alongside the table', async () => {
    await render({
      status: DOMAIN_VERIFICATION_STATUS.PENDING,
      dnsRecords: [{ type: 'A', name: '@', value: A_RECORD_VALUE }],
    });

    expect(
      await screen.findByText(/Add these records at your DNS provider/),
    ).toBeVisible();
  });

  it.each([
    [DOMAIN_VERIFICATION_STATUS.PENDING, AWAITING_DNS],
    [DOMAIN_VERIFICATION_STATUS.NOT_ADDED, 'Not added yet'],
    [DOMAIN_VERIFICATION_STATUS.ERROR, "Couldn't check"],
    [DOMAIN_VERIFICATION_STATUS.NOT_CONFIGURED, 'Unavailable'],
  ] as const)(
    'shows the %s badge and only the records fallback when no records are known',
    async (status, badge) => {
      await render({ status, dnsRecords: [] });

      expect(await screen.findByText(badge)).toBeVisible();
      expect(
        screen.getByText("DNS records aren't available right now."),
      ).toBeVisible();
      expect(
        screen.queryByText(/Add these records at your DNS provider/),
      ).toBeNull();
      expect(screen.queryByRole('table')).toBeNull();
    },
  );

  it.each([
    DOMAIN_VERIFICATION_STATUS.ERROR,
    DOMAIN_VERIFICATION_STATUS.NOT_CONFIGURED,
  ])('claims no check for %s', async (status) => {
    await render({ status, dnsRecords: [] });

    expect(await screen.findByRole('heading', { level: 2 })).toBeVisible();
    expect(screen.queryByText(CHECKED_JUST_NOW)).toBeNull();
  });
});
