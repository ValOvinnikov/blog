import 'server-only';

import { BILLING_LOG } from '@platform/constants/billing';
import { STRIPE_EVENT_TYPE } from '@platform/constants/stripe-event';
import {
  PAYMENT_FAILURE,
  STRIPE_BILLING_REASON,
} from '@platform/constants/stripe-payment';
import { invoiceAwaitsAuthentication } from '@platform/server/billing/invoice-awaits-authentication';
import { sendPaymentFailedNotice } from '@platform/server/billing/send-payment-failed-notice';
import { sendPaymentReceipt } from '@platform/server/billing/send-payment-receipt';
import type { TSyncedSubscription } from '@platform/server/billing/sync-stripe-subscription';
import type { TMaybeUndefined } from '@shinefold/config';
import type { TTenantPlan } from '@shinefold/config/constants';
import type { TValueOf } from '@shinefold/config/utils';
import type Stripe from 'stripe';

export type TOwnerInvoiceEmail = {
  send: () => Promise<void>;
  failedLog: TValueOf<typeof BILLING_LOG>;
};

const isFirstRenewalAttempt = ({
  attempt_count,
  billing_reason,
}: Stripe.Invoice): boolean =>
  attempt_count === 1 &&
  billing_reason === STRIPE_BILLING_REASON.SUBSCRIPTION_CYCLE;

// A payment waiting on the bank may also raise `invoice.payment_failed`; `invoice.payment_action_required` emails for it, so this one stays silent.
const sendDeclinedNotice = async (
  stripe: Stripe,
  invoice: Stripe.Invoice,
  tenantId: string,
  plan: TTenantPlan,
): Promise<void> => {
  if (invoice.id && (await invoiceAwaitsAuthentication(stripe, invoice.id))) {
    return;
  }
  await sendPaymentFailedNotice(
    invoice,
    tenantId,
    plan,
    PAYMENT_FAILURE.DECLINED,
  );
};

export const ownerInvoiceEmailFor = (
  stripe: Stripe,
  event: Stripe.Event,
  { tenantId, toPlan }: TSyncedSubscription,
): TMaybeUndefined<TOwnerInvoiceEmail> => {
  if (event.type === STRIPE_EVENT_TYPE.INVOICE_PAID) {
    const invoiceId = event.data.object.id;
    return {
      send: () => sendPaymentReceipt(stripe, invoiceId, tenantId, toPlan),
      failedLog: BILLING_LOG.RECEIPT_FAILED,
    };
  }
  if (
    event.type === STRIPE_EVENT_TYPE.INVOICE_PAYMENT_FAILED &&
    isFirstRenewalAttempt(event.data.object)
  ) {
    const invoice = event.data.object;
    return {
      send: () => sendDeclinedNotice(stripe, invoice, tenantId, toPlan),
      failedLog: BILLING_LOG.PAYMENT_FAILED_EMAIL_FAILED,
    };
  }
  if (
    event.type === STRIPE_EVENT_TYPE.INVOICE_PAYMENT_ACTION_REQUIRED &&
    isFirstRenewalAttempt(event.data.object)
  ) {
    const invoice = event.data.object;
    return {
      send: () =>
        sendPaymentFailedNotice(
          invoice,
          tenantId,
          toPlan,
          PAYMENT_FAILURE.AUTHENTICATION_REQUIRED,
        ),
      failedLog: BILLING_LOG.PAYMENT_FAILED_EMAIL_FAILED,
    };
  }
  return undefined;
};
