import 'server-only';

import {
  BILLING_LOG,
  BILLING_OVERVIEW_STATE,
} from '@platform/constants/billing';
import {
  listBillingInvoices,
  previewRenewal,
  type TBillingInvoice,
  type TBillingRenewal,
} from '@platform/server/billing/fetch-stripe-billing';
import { getStripeClient } from '@platform/server/billing/stripe-client';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import type { TMaybeUndefined } from '@shinefold/config';
import type { TTenantBilling } from '@shinefold/db/queries/tenants/tenant-billing';
import type Stripe from 'stripe';

export type TBillingOverview =
  | { state: typeof BILLING_OVERVIEW_STATE.NO_CUSTOMER }
  | { state: typeof BILLING_OVERVIEW_STATE.UNAVAILABLE }
  | {
      state: typeof BILLING_OVERVIEW_STATE.LOADED;
      renewal: TBillingRenewal;
      invoices: TBillingInvoice[];
    };

const UNAVAILABLE = { state: BILLING_OVERVIEW_STATE.UNAVAILABLE } as const;

const NO_RENEWAL: TBillingRenewal = {
  nextPayment: undefined,
  endsAt: undefined,
};

const renewalOrNone = async (
  stripe: Stripe,
  tenantId: string,
  customer: string,
  subscription: TMaybeUndefined<string>,
): Promise<TBillingRenewal> => {
  if (!subscription) return NO_RENEWAL;
  try {
    return await previewRenewal(stripe, customer, subscription);
  } catch (error) {
    logger.error(BILLING_LOG.NEXT_PAYMENT_FAILED, {
      tenantId,
      ...toLoggableError(error),
    });
    return NO_RENEWAL;
  }
};

export const loadBillingOverview = async (
  tenantId: string,
  billing: TMaybeUndefined<TTenantBilling>,
): Promise<TBillingOverview> => {
  const customer = billing?.stripeCustomerId;
  if (!customer) return { state: BILLING_OVERVIEW_STATE.NO_CUSTOMER };

  const stripe = getStripeClient();
  if (!stripe) {
    logger.error(BILLING_LOG.STRIPE_UNCONFIGURED, { tenantId });
    return UNAVAILABLE;
  }

  const subscription = billing.stripeSubscriptionId;
  try {
    const [invoices, renewal] = await Promise.all([
      listBillingInvoices(stripe, customer),
      renewalOrNone(stripe, tenantId, customer, subscription),
    ]);
    return { state: BILLING_OVERVIEW_STATE.LOADED, renewal, invoices };
  } catch (error) {
    logger.error(BILLING_LOG.OVERVIEW_FAILED, {
      tenantId,
      ...toLoggableError(error),
    });
    return UNAVAILABLE;
  }
};
