import { SPACING_SCALE } from '@blog/config';
import { BAND_SPACING_TOP, tv } from '@blog/ui/lib/styling';

export const moduleSlotVariants = tv({
  base: [
    'mx-auto w-full',
    'max-w-page px-gutter',
    BAND_SPACING_TOP[SPACING_SCALE.MD],
    'empty:hidden',
  ],
});
