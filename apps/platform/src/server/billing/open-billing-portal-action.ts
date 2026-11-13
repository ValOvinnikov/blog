'use server';

import {
  ACTION_OUTCOME,
  type TActionResult,
  type TMaybeUndefined,
} from '@blog/config';
import { queries } from '@blog/db';
import { toOutcome } from '@blog/utils/to-outcome';
import {
  BILLING_LOG,
  BILLING_REFUSAL,
  type TBillingRefusal,
} from '@platform/constants/billing';
import { requireTenantOwner } from '@platform/server/auth/require-tenant-owner';
import { getStripeClient } from '@platform/server/billing/stripe-client';
import { env } from '@platform/utils/env/env';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import { adminRoutes } from '@platform/utils/routes/routes';
import { redirect } from 'next/navigation';

export type TOpenBillingPortalResult = TActionResult<
  typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
  never,
  never,
  TBillingRefusal
>;

const createPortalUrl = async (
  tenantId: string,
  customer: string,
): Promise<TMaybeUndefined<string>> => {
  const stripe = getStripeClient();
  const baseUrl = env.PLATFORM_APP_BASE_URL;
  if (!stripe || !baseUrl) {
    logger.error(BILLING_LOG.STRIPE_UNCONFIGURED, { tenantId });
    return undefined;
  }

  try {
    const { url } = await stripe.billingPortal.sessions.create({
      customer,
      return_url: new URL(adminRoutes.dashboardBilling(), baseUrl).toString(),
    });
    return url;
  } catch (error) {
    logger.error(BILLING_LOG.PORTAL_FAILED, {
      tenantId,
      ...toLoggableError(error),
    });
    return undefined;
  }
};

export const openBillingPortalAction = async (
  tenantId: string,
): Promise<TOpenBillingPortalResult> => {
  const { tenant } = await requireTenantOwner(tenantId);
  const billing = await queries.tenants.getTenantBilling(tenant.id);
  const customer = billing?.stripeCustomerId;
  if (!customer) {
    return {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: BILLING_REFUSAL.NO_CUSTOMER,
    };
  }

  const url = await createPortalUrl(tenant.id, customer);
  if (!url) return toOutcome(ACTION_OUTCOME.SERVER_ERROR);

  redirect(url);
};
