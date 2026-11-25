import 'server-only';

import {
  BILLED_INVOICE_STATUSES,
  BILLING_INVOICE_LIMIT,
  STRIPE_ERROR_CODE,
  STRIPE_LIVE_SUBSCRIPTION_STATUSES,
  STRIPE_SUBSCRIPTION_STATUS,
  type TBilledInvoiceStatus,
} from '@platform/constants/billing';
import { type TStripeAmount, type TMaybeUndefined } from '@shinefold/config';
import { isOneOf } from '@shinefold/utils/primitives';
import Stripe from 'stripe';

import { readAmountOwed, type TBillingAmountOwed } from './read-amount-owed';
import { fromStripeTime } from './stripe-time';
import { subscriptionEndsAt } from './subscription-ends-at';

export type TBillingInvoice = {
  id: string;
  issuedAt: Date;
  amount: TStripeAmount;
  status: TBilledInvoiceStatus;
  url: TMaybeUndefined<string>;
};

export type TBillingNextPayment = {
  dueAt: Date;
  amount: TStripeAmount;
};

export type TBillingRenewal = {
  nextPayment: TMaybeUndefined<TBillingNextPayment>;
  endsAt: TMaybeUndefined<Date>;
  amountOwed: TMaybeUndefined<TBillingAmountOwed>;
};

export const NO_RENEWAL: TBillingRenewal = {
  nextPayment: undefined,
  endsAt: undefined,
  amountOwed: undefined,
};

const toBillingInvoice = ({
  id,
  created,
  total,
  currency,
  status,
  invoice_pdf,
  hosted_invoice_url,
}: Stripe.Invoice): TMaybeUndefined<TBillingInvoice> =>
  isOneOf(BILLED_INVOICE_STATUSES, status)
    ? {
        id,
        issuedAt: fromStripeTime(created),
        amount: { minorUnits: total, currency },
        status,
        url: invoice_pdf ?? hosted_invoice_url ?? undefined,
      }
    : undefined;

export const listBillingInvoices = async (
  stripe: Stripe,
  customer: string,
): Promise<TBillingInvoice[]> => {
  const invoices = await stripe.invoices
    .list({ customer, limit: BILLING_INVOICE_LIMIT })
    .autoPagingToArray({ limit: BILLING_INVOICE_LIMIT });

  return invoices.flatMap((invoice) => toBillingInvoice(invoice) ?? []);
};

const isNoUpcomingInvoice = (error: unknown): boolean =>
  error instanceof Stripe.errors.StripeError &&
  error.code === STRIPE_ERROR_CODE.INVOICE_UPCOMING_NONE;

const previewNextPayment = async (
  stripe: Stripe,
  customer: string,
  subscription: string,
): Promise<TMaybeUndefined<TBillingNextPayment>> => {
  try {
    const { next_payment_attempt, created, amount_due, currency } =
      await stripe.invoices.createPreview({ customer, subscription });

    return {
      dueAt: fromStripeTime(next_payment_attempt ?? created),
      amount: { minorUnits: amount_due, currency },
    };
  } catch (error) {
    if (isNoUpcomingInvoice(error)) return undefined;
    throw error;
  }
};

export const previewRenewal = async (
  stripe: Stripe,
  customer: string,
  subscriptionId: string,
): Promise<TBillingRenewal> => {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const { status } = subscription;
  if (!isOneOf(STRIPE_LIVE_SUBSCRIPTION_STATUSES, status)) return NO_RENEWAL;
  const endsAt = subscriptionEndsAt(subscription);
  if (status === STRIPE_SUBSCRIPTION_STATUS.PAST_DUE) {
    const amountOwed = await readAmountOwed(stripe, subscriptionId);
    return { ...NO_RENEWAL, endsAt, amountOwed };
  }
  if (endsAt) return { ...NO_RENEWAL, endsAt };
  const nextPayment = await previewNextPayment(
    stripe,
    customer,
    subscriptionId,
  );
  return { ...NO_RENEWAL, nextPayment };
};
