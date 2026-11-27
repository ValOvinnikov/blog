import messages from '@platform/i18n/messages/en.json';
import { NO_RENEWAL } from '@platform/server/billing/fetch-stripe-billing';
import { MOCK_AMOUNT_PAID_TEXT } from '@platform/testing/billing/fixtures';
import {
  MOCK_AMOUNT_OWED,
  MOCK_NEXT_PAYMENT,
  MOCK_RETRY_AT,
} from '@platform/testing/billing/overview';
import { customRender, screen } from '@platform/testing/custom-render';
import { adminRoutes } from '@platform/utils/routes/routes';
import { TENANT_PLAN } from '@shinefold/config/constants';
import { TENANT_STATUS } from '@shinefold/db/constants';

import { PlanCard } from './plan-card';

const { billingPage } = messages;
const MOCK_DATE_TEXT = 'Dec 2, 2026';
const MOCK_RETRY_DATE_TEXT = 'Nov 28, 2026';

const setup = customRender(PlanCard, {
  plan: TENANT_PLAN.GROWTH,
  status: TENANT_STATUS.PAST_DUE,
  hasPayments: true,
  isSubscribed: true,
  renewal: { ...NO_RENEWAL, nextPayment: MOCK_NEXT_PAYMENT },
  canChangePlan: true,
});

describe(`<${PlanCard.name}/>`, () => {
  describe('a paying site', () => {
    beforeEach(() => {
      setup();
    });

    it('shows the plan and its status', () => {
      const plan = screen.getByText('Growth');
      const status = screen.getByText('Past due');

      expect(plan).toBeVisible();
      expect(status).toBeVisible();
    });

    it('links to the plan change', () => {
      const changePlan = screen.getByRole('link', {
        name: billingPage.changePlan,
      });

      expect(changePlan).toHaveAttribute(
        'href',
        adminRoutes.dashboardUpgrade(),
      );
    });

    it('shows the amount and date of the next payment', () => {
      const nextPayment = screen.getByText(`${MOCK_AMOUNT_PAID_TEXT} on`);
      const dueDate = screen.getByText(MOCK_DATE_TEXT);

      expect(nextPayment).toHaveTextContent(
        `${MOCK_AMOUNT_PAID_TEXT} on ${MOCK_DATE_TEXT}`,
      );
      expect(dueDate).toHaveAttribute(
        'dateTime',
        MOCK_NEXT_PAYMENT.dueAt.toISOString(),
      );
    });
  });

  it('offers no plan change to a viewer who cannot change the plan', () => {
    setup({ canChangePlan: false });

    const changePlan = screen.queryByRole('link', {
      name: billingPage.changePlan,
    });

    expect(changePlan).not.toBeInTheDocument();
  });

  it('says no payment is scheduled when there is none', () => {
    setup({ renewal: NO_RENEWAL });

    const nextPayment = screen.getByText('None scheduled');

    expect(nextPayment).toBeVisible();
  });

  describe('a past-due site', () => {
    it('shows the amount owed and when it is tried again, not the next payment', () => {
      setup({ renewal: { ...NO_RENEWAL, amountOwed: MOCK_AMOUNT_OWED } });

      const owed = screen.getByText(`${MOCK_AMOUNT_PAID_TEXT}, next try on`);
      const retryDate = screen.getByText(MOCK_RETRY_DATE_TEXT);
      const nextPaymentLabel = screen.queryByText(billingPage.nextPaymentLabel);

      expect(owed).toHaveTextContent(
        `${MOCK_AMOUNT_PAID_TEXT}, next try on ${MOCK_RETRY_DATE_TEXT}`,
      );
      expect(retryDate).toHaveAttribute(
        'dateTime',
        MOCK_RETRY_AT.toISOString(),
      );
      expect(nextPaymentLabel).not.toBeInTheDocument();
    });

    it('says the amount is not tried again once Stripe has stopped', () => {
      setup({
        renewal: {
          ...NO_RENEWAL,
          amountOwed: { ...MOCK_AMOUNT_OWED, retryAt: undefined },
        },
      });

      const owed = screen.getByText(
        `${MOCK_AMOUNT_PAID_TEXT}, not tried again automatically`,
      );

      expect(owed).toBeVisible();
    });
  });

  describe('a plan cancelled to end', () => {
    beforeEach(() => {
      setup({ renewal: { ...NO_RENEWAL, endsAt: MOCK_NEXT_PAYMENT.dueAt } });
    });

    it('says when the plan ends', () => {
      const ends = screen.getByText(/^Your plan ends on/);
      const endDate = screen.getByText(MOCK_DATE_TEXT);

      expect(ends).toHaveTextContent(`Your plan ends on ${MOCK_DATE_TEXT}.`);
      expect(endDate).toHaveAttribute(
        'dateTime',
        MOCK_NEXT_PAYMENT.dueAt.toISOString(),
      );
    });

    it('offers no plan change and no next payment', () => {
      const changePlan = screen.queryByRole('link', {
        name: billingPage.changePlan,
      });
      const nextPaymentLabel = screen.queryByText(billingPage.nextPaymentLabel);

      expect(changePlan).not.toBeInTheDocument();
      expect(nextPaymentLabel).not.toBeInTheDocument();
    });
  });

  it('says a site with no billing account has no payments yet', () => {
    setup({
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.TRIAL,
      hasPayments: false,
      isSubscribed: false,
      renewal: NO_RENEWAL,
    });

    const noPayments = screen.getByText('Your site has no payments yet.');
    const nextPaymentLabel = screen.queryByText(billingPage.nextPaymentLabel);
    const upgrade = screen.getByRole('link', { name: 'Upgrade' });

    expect(noPayments).toBeVisible();
    expect(nextPaymentLabel).not.toBeInTheDocument();
    expect(upgrade).toHaveAttribute('href', adminRoutes.dashboardUpgrade());
  });
});
