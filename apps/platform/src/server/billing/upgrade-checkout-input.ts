import {
  SELLABLE_TENANT_PLANS,
  BILLING_INTERVAL,
} from '@shinefold/config/constants';
import { z } from 'zod';

const MAX_PROMOTION_CODE_LENGTH = 64;

export const planChoiceSchema = z.object({
  plan: z.enum(SELLABLE_TENANT_PLANS),
  interval: z.enum(BILLING_INTERVAL),
});

export const promoCodeSchema = z
  .string()
  .trim()
  .min(1)
  .max(MAX_PROMOTION_CODE_LENGTH)
  .optional()
  .catch(undefined);

export const upgradeCheckoutInputSchema = planChoiceSchema.extend({
  promo: promoCodeSchema,
});

export type TUpgradeCheckoutInput = z.input<typeof upgradeCheckoutInputSchema>;
