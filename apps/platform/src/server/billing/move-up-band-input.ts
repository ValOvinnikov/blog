import { PAID_SUBSCRIBER_BAND_CEILINGS } from '@shinefold/db/constants';
import { z } from 'zod';

export const moveUpQuoteSchema = z.object({
  ceiling: z.union(
    PAID_SUBSCRIBER_BAND_CEILINGS.map((ceiling) => z.literal(ceiling)),
  ),
});

export const moveUpBandSchema = moveUpQuoteSchema.extend({
  prorationDate: z.number().int().positive(),
});

export type TMoveUpQuoteInput = z.input<typeof moveUpQuoteSchema>;

export type TMoveUpBandInput = z.input<typeof moveUpBandSchema>;
