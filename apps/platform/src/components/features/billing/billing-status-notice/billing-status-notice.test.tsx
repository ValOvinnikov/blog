import { TENANT_PLAN } from '@blog/config/constants';
import { TENANT_STATUS } from '@blog/db/constants';
import en from '@platform/i18n/messages/en.json';
import { mockTenantDomainRows } from '@platform/testing/custom-domain/fixtures';
import {
  customRenderAsync,
  screen,
  within,
} from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  MOCK_ARCHIVED_AT,
  MOCK_CUSTOM_DOMAIN,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ROOT_DOMAIN,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import { env } from '@platform/utils/env/env';
import { adminRoutes } from '@platform/utils/routes/routes';

import { BillingStatusNotice } from './billing-status-notice';

vi.mock('@platform/utils/env/env');

const { countMembershipsOverSeatsMock, listTenantDomainsMock } = vi.hoisted(
  () => ({
    countMembershipsOverSeatsMock: vi.fn(),
    listTenantDomainsMock: vi.fn(),
  }),
);

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    memberships: { countMembershipsOverSeats: countMembershipsOverSeatsMock },
    tenantDomains: { listTenantDomains: listTenantDomainsMock },
  },
}));
const envMock: Partial<Record<keyof typeof env, string>> = env;
const { billingStatusNotice } = en;
const t = makeEnTranslator('billingStatusNotice');

const MOCK_GRACE_STARTED_AT = new Date('2026-11-01T22:15:00.000Z');
const MOCK_GRACE_ENDS_AT = new Date('2026-11-15T00:00:00.000Z');
const MOCK_GRACE_ENDS_ON = 'Nov 15, 2026';
const MOCK_LOCKED_MEMBER_COUNT = 2;
const MEMBERS_LINE = `On ${MOCK_GRACE_ENDS_ON}, 2 team members lose access to this site's admin.`;
const DOMAIN_LINE = `On ${MOCK_GRACE_ENDS_ON}, ${MOCK_CUSTOM_DOMAIN} stops being the main address and redirects to ${MOCK_TENANT_DOMAIN}.`;

const IN_GRACE = mockTenant({
  plan: TENANT_PLAN.FREE,
  status: TENANT_STATUS.ACTIVE,
  primaryDomain: MOCK_CUSTOM_DOMAIN,
  downgradeGraceStartedAt: MOCK_GRACE_STARTED_AT,
});
const PAST_DUE = mockTenant({
  plan: TENANT_PLAN.GROWTH,
  status: TENANT_STATUS.PAST_DUE,
});

const setup = customRenderAsync(BillingStatusNotice, {
  tenant: IN_GRACE,
  canOpenBilling: true,
  canUpgrade: true,
});

describe(`<${BillingStatusNotice.name}/>`, () => {
  beforeEach(() => {
    envMock.TENANT_ROOT_DOMAIN = MOCK_TENANT_ROOT_DOMAIN;
    countMembershipsOverSeatsMock
      .mockReset()
      .mockResolvedValue(MOCK_LOCKED_MEMBER_COUNT);
    listTenantDomainsMock.mockReset().mockResolvedValue(mockTenantDomainRows());
  });

  describe('a site in its downgrade grace', () => {
    describe('with members over the seats and a custom main address', () => {
      let notice: HTMLElement;

      beforeEach(async () => {
        await setup();
        notice = screen.getByRole('status');
      });

      it('names what locks and redirects with the date it happens', () => {
        const endDates = within(notice).getAllByText(MOCK_GRACE_ENDS_ON);

        expect(notice).toHaveTextContent(t('graceTitle', { plan: 'Free' }));
        expect(notice).toHaveTextContent(MEMBERS_LINE);
        expect(notice).toHaveTextContent(DOMAIN_LINE);
        expect(endDates).toHaveLength(2);
        endDates.forEach((endDate) => {
          expect(endDate).toHaveAttribute(
            'datetime',
            MOCK_GRACE_ENDS_AT.toISOString(),
          );
        });
      });

      it('links a viewer who can upgrade to the Upgrade page', () => {
        const upgradeLink = within(notice).getByRole('link', {
          name: billingStatusNotice.graceUpgrade,
        });

        expect(upgradeLink).toHaveAttribute(
          'href',
          adminRoutes.dashboardUpgrade(),
        );
        expect(notice).toHaveTextContent(billingStatusNotice.graceKeep);
      });
    });

    it('tells a member who cannot upgrade that the owner can', async () => {
      await setup({ canUpgrade: false });

      const notice = screen.getByRole('status');
      const upgradeLink = within(notice).queryByRole('link');

      expect(upgradeLink).not.toBeInTheDocument();
      expect(notice).toHaveTextContent(billingStatusNotice.graceKeepAskOwner);
    });

    it('names only the members when the subdomain is already the main address', async () => {
      await setup({
        tenant: { ...IN_GRACE, primaryDomain: MOCK_TENANT_DOMAIN },
      });

      const notice = screen.getByRole('status');

      expect(notice).toHaveTextContent(MEMBERS_LINE);
      expect(notice).not.toHaveTextContent(MOCK_CUSTOM_DOMAIN);
    });

    describe('with no member over the seats', () => {
      beforeEach(() => {
        countMembershipsOverSeatsMock.mockResolvedValue(0);
      });

      it('names only the domain', async () => {
        await setup();

        const notice = screen.getByRole('status');

        expect(notice).toHaveTextContent(DOMAIN_LINE);
        expect(notice).not.toHaveTextContent(MEMBERS_LINE);
      });

      it('renders nothing when nothing will redirect either', async () => {
        await setup({
          tenant: { ...IN_GRACE, primaryDomain: MOCK_TENANT_DOMAIN },
        });

        const notice = screen.queryByRole('status');

        expect(notice).not.toBeInTheDocument();
      });
    });
  });

  it.each([
    ['out of grace', { ...IN_GRACE, downgradeGraceStartedAt: null }],
    ['archived', { ...IN_GRACE, deprovisionedAt: MOCK_ARCHIVED_AT }],
  ])('renders nothing and reads nothing for a site %s', async (_, tenant) => {
    await setup({ tenant });

    const notice = screen.queryByRole('status');

    expect(notice).not.toBeInTheDocument();
    expect(countMembershipsOverSeatsMock).not.toHaveBeenCalled();
  });

  it('asks the owner of a past-due site to update the payment method, with no date', async () => {
    await setup({ tenant: PAST_DUE });

    const notice = screen.getByRole('status');
    const billingLink = within(notice).getByRole('link', {
      name: billingStatusNotice.pastDueAction,
    });
    const date = within(notice).queryByRole('time');

    expect(notice).toHaveTextContent(billingStatusNotice.pastDueTitle);
    expect(notice).toHaveTextContent(
      t('pastDueDescription', { plan: 'Growth' }),
    );
    expect(billingLink).toHaveAttribute('href', adminRoutes.dashboardBilling());
    expect(date).not.toBeInTheDocument();
    expect(countMembershipsOverSeatsMock).not.toHaveBeenCalled();
  });

  it('shows a past-due site nothing to a member outside Billing’s audience', async () => {
    await setup({ tenant: PAST_DUE, canOpenBilling: false });

    const notice = screen.queryByRole('status');

    expect(notice).not.toBeInTheDocument();
  });
});
