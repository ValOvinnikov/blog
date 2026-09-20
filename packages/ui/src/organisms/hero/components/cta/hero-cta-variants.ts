import { CONTENT_ALIGNMENT } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const heroCtaVariants = tv({
  base: ['mt-auto pt-[18px]', 'flex flex-wrap items-center gap-3'],
  variants: {
    contentAlignment: {
      [CONTENT_ALIGNMENT.LEFT]: ['justify-start'],
      [CONTENT_ALIGNMENT.CENTER]: ['justify-center'],
      [CONTENT_ALIGNMENT.RIGHT]: ['justify-end'],
    },
  },
});

export type THeroCtaVariants = VariantProps<typeof heroCtaVariants>;
