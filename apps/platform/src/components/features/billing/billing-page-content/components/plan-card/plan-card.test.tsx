import messages from '@platform/i18n/messages/en.json';
import { MOCK_NEXT_PAYMENT } from '@platform/testing/billing/overview';
import { customRender, screen } from '@platform/testing/custom-render';
import { adminRoutes } from '@platform/utils/routes/routes';
import { TENANT_PLAN } from '@shinefold/config/constants';
import { TENANT_STATUS } from '@shinefold/db/constants';

import { PlanCard } from './plan-card';

const { billingPage } = messages;
const MOCK_DATE_TEXT = 'Dec 2, 2026';

const setup = customRender(PlanCard, {
  plan: TENANT_PLAN.GROWTH,
  status: TENANT_STATUS.PAST_DUE,
  hasPayments: true,
  isSubscribed: true,
  nextPayment: MOCK_NEXT_PAYMENT,
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
      const nextPayment = screen.getByText(/^\$29\.00 on/);
      const dueDate = screen.getByText(MOCK_DATE_TEXT);

      expect(nextPayment).toHaveTextContent(`$29.00 on ${MOCK_DATE_TEXT}`);
      expect(dueDate).toHaveAttribute(
        'dateTime',
        MOCK_NEXT_PAYMENT.dueAt.toISOString(),
      );
    });
  });

  it('says no payment is scheduled when there is none', () => {
    setup({ nextPayment: undefined });

    const nextPayment = screen.getByText('None scheduled');

    expect(nextPayment).toBeVisible();
  });

  describe('a plan cancelled to end', () => {
    beforeEach(() => {
      setup({ nextPayment: undefined, endsAt: MOCK_NEXT_PAYMENT.dueAt });
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
      nextPayment: undefined,
    });

    const noPayments = screen.getByText('Your site has no payments yet.');
    const nextPaymentLabel = screen.queryByText(billingPage.nextPaymentLabel);
    const upgrade = screen.getByRole('link', { name: 'Upgrade' });

    expect(noPayments).toBeVisible();
    expect(nextPaymentLabel).not.toBeInTheDocument();
    expect(upgrade).toHaveAttribute('href', adminRoutes.dashboardUpgrade());
  });
});
