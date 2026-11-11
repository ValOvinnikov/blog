import { tv } from '@blog/ui/lib/styling';

import { FULL_BLEED_TABLE } from './full-bleed';

export const expandableSectionVariants = tv({
  variants: {
    isFullBleed: {
      true: FULL_BLEED_TABLE,
    },
  },
});
