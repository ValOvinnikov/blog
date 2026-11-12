import { BILLING_GRACE } from '@platform/constants/billing';
import { createMockFaker } from '@platform/testing/mock-faker';

import { graceBillingFields } from './grace-billing-fields';

const graceFaker = createMockFaker(6875);
const MOCK_NOW = graceFaker.date.recent();
const MOCK_EARLIER = graceFaker.date.past({ refDate: MOCK_NOW });

describe(graceBillingFields, () => {
  it('starts the grace now when none is running', () => {
    expect(
      graceBillingFields(
        BILLING_GRACE.START,
        { downgradeGraceStartedAt: undefined },
        MOCK_NOW,
      ),
    ).toEqual({ downgradeGraceStartedAt: MOCK_NOW });
  });

  it('keeps a grace that is already running', () => {
    expect(
      graceBillingFields(
        BILLING_GRACE.START,
        { downgradeGraceStartedAt: MOCK_EARLIER },
        MOCK_NOW,
      ),
    ).toEqual({ downgradeGraceStartedAt: MOCK_EARLIER });
  });

  it('ends the grace and clears its email stamps', () => {
    expect(
      graceBillingFields(
        BILLING_GRACE.END,
        { downgradeGraceStartedAt: MOCK_EARLIER },
        MOCK_NOW,
      ),
    ).toEqual({
      downgradeGraceStartedAt: null,
      graceStartedEmailSentAt: null,
      graceHalfwayEmailSentAt: null,
      graceEndingEmailSentAt: null,
    });
  });

  it('writes no grace field while the grace is kept', () => {
    expect(
      graceBillingFields(
        BILLING_GRACE.KEEP,
        { downgradeGraceStartedAt: MOCK_EARLIER },
        MOCK_NOW,
      ),
    ).toEqual({});
  });
});
