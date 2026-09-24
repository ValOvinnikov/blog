import { CONTENT_ALIGNMENT } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const heroSocialVariants = tv({
  base: ['flex flex-wrap gap-2', 'pt-3'],
  variants: {
    contentAlignment: {
      [CONTENT_ALIGNMENT.LEFT]: ['justify-start'],
      [CONTENT_ALIGNMENT.CENTER]: ['justify-center'],
      [CONTENT_ALIGNMENT.RIGHT]: ['justify-end'],
    },
  },
});

export type THeroSocialVariants = VariantProps<typeof heroSocialVariants>;
