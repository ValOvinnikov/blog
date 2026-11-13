import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import { MOCK_NEXT_PAYMENT } from '@platform/testing/billing/overview';
import { customRender, screen } from '@platform/testing/custom-render';

import { PlanCard } from './plan-card';

const setup = customRender(PlanCard, {
  plan: TENANT_PLAN.GROWTH,
  status: TENANT_STATUS.PAST_DUE,
  hasPayments: true,
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

    it('shows the amount and date of the next payment', () => {
      const nextPayment = screen.getByText(/^\$29\.00 on/);
      const dueDate = screen.getByText('Dec 2, 2026');

      expect(nextPayment).toHaveTextContent('$29.00 on Dec 2, 2026');
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

  it('says a site with no billing account has no payments yet', () => {
    setup({
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.TRIAL,
      hasPayments: false,
      nextPayment: undefined,
    });

    const noPayments = screen.getByText('Your site has no payments yet.');
    const nextPaymentLabel = screen.queryByText('Next payment');

    expect(noPayments).toBeVisible();
    expect(nextPaymentLabel).not.toBeInTheDocument();
  });
});
