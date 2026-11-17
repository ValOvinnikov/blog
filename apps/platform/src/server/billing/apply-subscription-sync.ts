import 'server-only';

import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { onTenantPlanChange } from '@platform/server/tenants/on-tenant-plan-change';
import type { TMaybeUndefined } from '@shinefold/config';
import { after } from 'next/server';
import type Stripe from 'stripe';

import {
  syncStripeSubscription,
  type TSyncedSubscription,
} from './sync-stripe-subscription';

export const applySubscriptionSync = async (
  stripe: Stripe,
  subscriptionId: string,
): Promise<TMaybeUndefined<TSyncedSubscription>> => {
  const synced = await syncStripeSubscription(stripe, subscriptionId);
  if (synced && synced.fromPlan !== synced.toPlan) {
    const { tenantId, fromPlan, toPlan } = synced;
    after(() => revalidateSiteConfig(tenantId));
    after(() => onTenantPlanChange(tenantId, fromPlan, toPlan));
  }
  return synced;
};
