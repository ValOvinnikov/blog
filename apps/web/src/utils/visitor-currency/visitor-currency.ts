import { BILLING_CURRENCY } from '@shinefold/db/constants';
import { z } from 'zod';

export const VISITOR_CURRENCY_PATH = '/api/visitor-currency';

export const VISITOR_COUNTRY_HEADER = 'x-vercel-ip-country';

export const visitorCurrencySchema = z.object({
  currency: z.enum(BILLING_CURRENCY).optional(),
});

export type TVisitorCurrency = z.infer<typeof visitorCurrencySchema>;
