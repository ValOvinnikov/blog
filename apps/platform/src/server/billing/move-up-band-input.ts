import { PAID_SUBSCRIBER_BAND_CEILINGS } from '@shinefold/db/constants';
import { z } from 'zod';

export const moveUpBandSchema = z.object({
  ceiling: z.union(
    PAID_SUBSCRIBER_BAND_CEILINGS.map((ceiling) => z.literal(ceiling)),
  ),
});

export type TMoveUpBandInput = z.input<typeof moveUpBandSchema>;
