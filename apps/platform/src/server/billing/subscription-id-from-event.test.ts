import { STRIPE_EVENT_TYPE } from '@platform/constants/billing';
import {
  MOCK_STRIPE_SUBSCRIPTION_ID,
  mockStripeEvent,
  mockStripeInvoice,
} from '@platform/testing/billing/fixtures';

import { subscriptionIdFromEvent } from './subscription-id-from-event';

describe(subscriptionIdFromEvent, () => {
  it.each([
    STRIPE_EVENT_TYPE.SUBSCRIPTION_CREATED,
    STRIPE_EVENT_TYPE.SUBSCRIPTION_UPDATED,
    STRIPE_EVENT_TYPE.SUBSCRIPTION_DELETED,
  ])('reads the subscription id from %s', (type) => {
    expect(subscriptionIdFromEvent(mockStripeEvent(type))).toBe(
      MOCK_STRIPE_SUBSCRIPTION_ID,
    );
  });

  it.each([
    STRIPE_EVENT_TYPE.INVOICE_PAID,
    STRIPE_EVENT_TYPE.INVOICE_PAYMENT_FAILED,
  ])('reads the invoice subscription from %s', (type) => {
    expect(
      subscriptionIdFromEvent(mockStripeEvent(type, mockStripeInvoice())),
    ).toBe(MOCK_STRIPE_SUBSCRIPTION_ID);
  });

  it('ignores an invoice outside a subscription', () => {
    const event = mockStripeEvent(
      STRIPE_EVENT_TYPE.INVOICE_PAID,
      mockStripeInvoice({ parent: null }),
    );

    expect(subscriptionIdFromEvent(event)).toBeUndefined();
  });

  it('ignores an event type it does not handle', () => {
    expect(
      subscriptionIdFromEvent(mockStripeEvent('customer.created')),
    ).toBeUndefined();
  });
});
