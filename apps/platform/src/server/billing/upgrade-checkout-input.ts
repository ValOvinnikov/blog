import { TENANT_PLAN } from '@blog/db/constants';
import { BILLING_INTERVAL } from '@platform/constants/billing';
import { isSellablePlan } from '@platform/utils/sellable-plans/sellable-plans';
import { z } from 'zod';

const MAX_PROMOTION_CODE_LENGTH = 64;

export const upgradeCheckoutInputSchema = z.object({
  plan: z.enum(TENANT_PLAN).refine(isSellablePlan),
  interval: z.enum(BILLING_INTERVAL),
  promo: z
    .string()
    .trim()
    .min(1)
    .max(MAX_PROMOTION_CODE_LENGTH)
    .optional()
    .catch(undefined),
});

export type TUpgradeCheckoutInput = z.input<typeof upgradeCheckoutInputSchema>;
