import 'server-only';

import type { TMaybeUndefined } from '@blog/config';
import { isOneOf } from '@blog/utils/primitives';
import {
  BILLED_INVOICE_STATUSES,
  BILLING_INVOICE_LIMIT,
  STRIPE_ERROR_CODE,
  STRIPE_LIVE_SUBSCRIPTION_STATUSES,
  type TBilledInvoiceStatus,
} from '@platform/constants/billing';
import type { TStripeAmount } from '@platform/utils/format-stripe-amount/format-stripe-amount';
import Stripe from 'stripe';

import { fromStripeTime } from './stripe-time';

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

export const previewNextPayment = async (
  stripe: Stripe,
  customer: string,
  subscription: string,
): Promise<TMaybeUndefined<TBillingNextPayment>> => {
  const { status, cancel_at_period_end } =
    await stripe.subscriptions.retrieve(subscription);
  if (
    cancel_at_period_end ||
    !isOneOf(STRIPE_LIVE_SUBSCRIPTION_STATUSES, status)
  ) {
    return undefined;
  }

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
