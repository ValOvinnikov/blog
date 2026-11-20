import 'server-only';

import { STRIPE_PRORATION_BEHAVIOR } from '@platform/constants/billing';
import type { TStripeAmount } from '@platform/utils/format-stripe-amount/format-stripe-amount';
import type { TMaybeNull, TMaybeUndefined } from '@shinefold/config';
import { isString } from '@shinefold/utils/primitives';
import type Stripe from 'stripe';

import type { TSubscriptionPlan } from './load-subscription-plan';
import type { TTargetPrices } from './schedule-change-at-renewal';
import { subscriptionItemsFor } from './subscription-items';

export type TPaymentCard = { brand: string; last4: string };

export type TMoveUpPreview = {
  dueToday: TStripeAmount;
  card: TMaybeUndefined<TPaymentCard>;
};

type TPaymentMethodField = TMaybeNull<string | Stripe.PaymentMethod>;

const CARD_EXPAND = [
  'default_payment_method',
  'customer.invoice_settings.default_payment_method',
];

const cardOf = (method: TPaymentMethodField): TMaybeUndefined<TPaymentCard> =>
  method && !isString(method) && method.card
    ? { brand: method.card.brand, last4: method.card.last4 }
    : undefined;

const customerMethodOf = (
  customer: Stripe.Subscription['customer'],
): TPaymentMethodField =>
  isString(customer) || customer.deleted
    ? null
    : customer.invoice_settings.default_payment_method;

export const previewMoveUp = async (
  stripe: Stripe,
  subscription: TSubscriptionPlan,
  prices: TTargetPrices,
): Promise<TMoveUpPreview> => {
  const [invoice, { default_payment_method, customer }] = await Promise.all([
    stripe.invoices.createPreview({
      subscription: subscription.id,
      subscription_details: {
        items: subscriptionItemsFor(subscription, prices),
        proration_behavior: STRIPE_PRORATION_BEHAVIOR.ALWAYS_INVOICE,
      },
    }),
    stripe.subscriptions.retrieve(subscription.id, { expand: CARD_EXPAND }),
  ]);
  return {
    dueToday: { minorUnits: invoice.amount_due, currency: invoice.currency },
    card: cardOf(default_payment_method) ?? cardOf(customerMethodOf(customer)),
  };
};
