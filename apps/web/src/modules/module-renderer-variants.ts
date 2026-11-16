import { SPACING_SCALE } from '@shinefold/config';
import { BAND_SPACING_TOP, tv } from '@shinefold/ui/lib/styling';

export const moduleSlotVariants = tv({
  base: [
    'mx-auto w-full',
    'max-w-page px-gutter',
    BAND_SPACING_TOP[SPACING_SCALE.MD],
    'empty:hidden',
  ],
});
