import 'server-only';

import type { TMaybeUndefined } from '@blog/config';
import { TENANT_PLAN, type TTenantPlan } from '@blog/db/constants';
import type { TTenantBilling } from '@blog/db/queries/tenants/tenant-billing';
import {
  BILLING_LOG,
  BILLING_OVERVIEW_STATE,
} from '@platform/constants/billing';
import {
  listBillingInvoices,
  previewNextPayment,
  type TBillingInvoice,
  type TBillingNextPayment,
} from '@platform/server/billing/fetch-stripe-billing';
import { getStripeClient } from '@platform/server/billing/stripe-client';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';

export type TBillingOverview =
  | { state: typeof BILLING_OVERVIEW_STATE.NO_CUSTOMER }
  | { state: typeof BILLING_OVERVIEW_STATE.UNAVAILABLE }
  | {
      state: typeof BILLING_OVERVIEW_STATE.LOADED;
      nextPayment: TMaybeUndefined<TBillingNextPayment>;
      invoices: TBillingInvoice[];
    };

const UNAVAILABLE = { state: BILLING_OVERVIEW_STATE.UNAVAILABLE } as const;

export const loadBillingOverview = async (
  tenantId: string,
  plan: TTenantPlan,
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
    const [invoices, nextPayment] = await Promise.all([
      listBillingInvoices(stripe, customer),
      subscription && plan !== TENANT_PLAN.FREE
        ? previewNextPayment(stripe, customer, subscription)
        : undefined,
    ]);
    return { state: BILLING_OVERVIEW_STATE.LOADED, nextPayment, invoices };
  } catch (error) {
    logger.error(BILLING_LOG.OVERVIEW_FAILED, {
      tenantId,
      ...toLoggableError(error),
    });
    return UNAVAILABLE;
  }
};
