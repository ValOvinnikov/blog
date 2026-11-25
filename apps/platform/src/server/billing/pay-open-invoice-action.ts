'use server';

import { BILLING_LOG } from '@platform/constants/billing';
import { requireTenantOwner } from '@platform/server/auth/require-tenant-owner';
import { findOpenInvoice } from '@platform/server/billing/find-open-invoice';
import { getStripeClient } from '@platform/server/billing/stripe-client';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import { adminRoutes } from '@platform/utils/routes/routes';
import { tenantIdSchema } from '@platform/utils/tenant-id-schema/tenant-id-schema';
import {
  ACTION_OUTCOME,
  type TActionResult,
  type TMaybeUndefined,
} from '@shinefold/config';
import { queries } from '@shinefold/db';
import { toOutcome } from '@shinefold/utils/to-outcome';
import { redirect } from 'next/navigation';

export type TPayOpenInvoiceResult = TActionResult<
  typeof ACTION_OUTCOME.SERVER_ERROR
>;

const resolvePayDestination = async (
  tenantId: string,
  subscription: string,
): Promise<TMaybeUndefined<string>> => {
  const stripe = getStripeClient();
  if (!stripe) {
    logger.error(BILLING_LOG.STRIPE_UNCONFIGURED, { tenantId });
    return undefined;
  }

  try {
    const invoice = await findOpenInvoice(stripe, subscription);
    return invoice?.hosted_invoice_url ?? adminRoutes.dashboardBilling();
  } catch (error) {
    logger.error(BILLING_LOG.OPEN_INVOICE_FAILED, {
      tenantId,
      ...toLoggableError(error),
    });
    return undefined;
  }
};

export const payOpenInvoiceAction = async (
  tenantId: string,
): Promise<TPayOpenInvoiceResult> => {
  const parsed = tenantIdSchema.safeParse(tenantId);
  if (!parsed.success) return toOutcome(ACTION_OUTCOME.SERVER_ERROR);

  await requireTenantOwner(parsed.data);
  const billing = await queries.tenants.getTenantBilling(parsed.data);
  const subscription = billing?.stripeSubscriptionId;
  if (!subscription) redirect(adminRoutes.dashboardBilling());

  const destination = await resolvePayDestination(parsed.data, subscription);
  if (!destination) return toOutcome(ACTION_OUTCOME.SERVER_ERROR);

  redirect(destination);
};
