import { CONTENT_ALIGNMENT } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const heroBodyVariants = tv({
  base: ['mt-5 max-w-[52ch] text-prose leading-[1.6]'],
  variants: {
    contentAlignment: {
      [CONTENT_ALIGNMENT.LEFT]: ['text-left'],
      [CONTENT_ALIGNMENT.CENTER]: ['text-center'],
      [CONTENT_ALIGNMENT.RIGHT]: ['text-right'],
    },
  },
});

export type THeroBodyVariants = VariantProps<typeof heroBodyVariants>;
