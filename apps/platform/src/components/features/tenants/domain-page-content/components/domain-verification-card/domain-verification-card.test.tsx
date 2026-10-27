import { DOMAIN_VERIFICATION_STATUS } from '@platform/constants/domain';
import type { TProjectDomain } from '@platform/server/provisioning/vercel-domains-api';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import {
  MOCK_CUSTOM_DOMAIN,
  MOCK_VERCEL_A_RECORD,
} from '@platform/testing/tenants/fixtures';
import { Suspense } from 'react';

import {
  DomainVerificationCard,
  type TDomainVerificationCardProps,
} from './domain-verification-card';

const AWAITING_DNS = 'Awaiting DNS';
const CHECKED_JUST_NOW = 'Checked just now';
const CNAME_RECORD_VALUE = 'cname.vercel-dns.com';

const SuspendedDomainVerificationCard = (
  props: TDomainVerificationCardProps,
) => (
  <Suspense>
    <DomainVerificationCard {...props} />
  </Suspense>
);

const renderCard = customRenderAsync(SuspendedDomainVerificationCard, {
  domain: MOCK_CUSTOM_DOMAIN,
  projectDomain: Promise.resolve({
    status: DOMAIN_VERIFICATION_STATUS.PENDING,
    dnsRecords: [],
  }),
});

const setup = (projectDomain: TProjectDomain) =>
  renderCard({ projectDomain: Promise.resolve(projectDomain) });

describe(`<${DomainVerificationCard.name}/>`, () => {
  it('shows the status badge in the card header beside the domain', async () => {
    await setup({
      status: DOMAIN_VERIFICATION_STATUS.PENDING,
      dnsRecords: [],
    });

    const heading = await screen.findByRole('heading', {
      level: 2,
      name: `Point ${MOCK_CUSTOM_DOMAIN} at us`,
    });
    const statusBadge = screen.getByText(AWAITING_DNS);
    const checkedAt = screen.getByText(CHECKED_JUST_NOW);

    expect(heading).toBeVisible();
    expect(statusBadge).toBeVisible();
    expect(checkedAt).toBeVisible();
    expect(heading).not.toHaveTextContent(AWAITING_DNS);
  });

  it('renders the DNS records table when pending with known records', async () => {
    await setup({
      status: DOMAIN_VERIFICATION_STATUS.PENDING,
      dnsRecords: [
        { type: 'A', name: '@', value: MOCK_VERCEL_A_RECORD },
        { type: 'CNAME', name: 'www', value: CNAME_RECORD_VALUE },
      ],
    });

    const table = await screen.findByRole('table');
    const aRecord = screen.getByText(MOCK_VERCEL_A_RECORD);
    const cnameRecord = screen.getByText(CNAME_RECORD_VALUE);

    expect(table).toBeVisible();
    expect(aRecord).toBeVisible();
    expect(cnameRecord).toBeVisible();
  });

  describe('once verified', () => {
    beforeEach(async () => {
      await setup({
        status: DOMAIN_VERIFICATION_STATUS.VERIFIED,
        dnsRecords: [],
      });
    });

    it('shows the verified empty state with no records table', async () => {
      const verifiedBadge = await screen.findByText('Verified');
      const emptyState = screen.getByText(
        "This domain is verified — there's nothing left to configure.",
      );
      const table = screen.queryByRole('table');

      expect(verifiedBadge).toBeVisible();
      expect(emptyState).toBeVisible();
      expect(table).not.toBeInTheDocument();
    });

    it('titles a verified domain as connected', async () => {
      const heading = await screen.findByRole('heading', {
        level: 2,
        name: `${MOCK_CUSTOM_DOMAIN} is connected`,
      });

      expect(heading).toBeVisible();
    });
  });

  it('asks for the records only alongside the table', async () => {
    await setup({
      status: DOMAIN_VERIFICATION_STATUS.PENDING,
      dnsRecords: [{ type: 'A', name: '@', value: MOCK_VERCEL_A_RECORD }],
    });

    const instructions = await screen.findByText(
      /Add these records at your DNS provider/,
    );

    expect(instructions).toBeVisible();
  });

  it.each([
    [DOMAIN_VERIFICATION_STATUS.PENDING, AWAITING_DNS],
    [DOMAIN_VERIFICATION_STATUS.NOT_ADDED, 'Not added yet'],
    [DOMAIN_VERIFICATION_STATUS.ERROR, "Couldn't check"],
    [DOMAIN_VERIFICATION_STATUS.NOT_CONFIGURED, 'Unavailable'],
  ] as const)(
    'shows the %s badge and only the records fallback when no records are known',
    async (status, badge) => {
      await setup({ status, dnsRecords: [] });

      const statusBadge = await screen.findByText(badge);
      const fallback = screen.getByText(
        "DNS records aren't available right now.",
      );
      const instructions = screen.queryByText(
        /Add these records at your DNS provider/,
      );
      const table = screen.queryByRole('table');

      expect(statusBadge).toBeVisible();
      expect(fallback).toBeVisible();
      expect(instructions).not.toBeInTheDocument();
      expect(table).not.toBeInTheDocument();
    },
  );

  it.each([
    DOMAIN_VERIFICATION_STATUS.ERROR,
    DOMAIN_VERIFICATION_STATUS.NOT_CONFIGURED,
  ])('claims no check for %s', async (status) => {
    await setup({ status, dnsRecords: [] });

    const heading = await screen.findByRole('heading', { level: 2 });
    const checkedAt = screen.queryByText(CHECKED_JUST_NOW);

    expect(heading).toBeVisible();
    expect(checkedAt).not.toBeInTheDocument();
  });
});
