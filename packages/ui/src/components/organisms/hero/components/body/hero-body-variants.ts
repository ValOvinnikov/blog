import { CONTENT_ALIGNMENT } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const heroBodyVariants = tv({
  base: ['mt-5 text-prose leading-[1.6]', '[&>*+*]:mt-4'],
  variants: {
    contentAlignment: {
      [CONTENT_ALIGNMENT.LEFT]: ['text-left'],
      [CONTENT_ALIGNMENT.CENTER]: ['text-center'],
      [CONTENT_ALIGNMENT.RIGHT]: ['text-right'],
    },
  },
});

export type THeroBodyVariants = VariantProps<typeof heroBodyVariants>;
