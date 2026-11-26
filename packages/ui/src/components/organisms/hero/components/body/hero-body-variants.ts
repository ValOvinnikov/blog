import { CONTENT_ALIGNMENT, TEXT_ROLE } from '@shinefold/config';
import { tv, TYPOGRAPHY } from '@shinefold/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const heroBodyVariants = tv({
  base: ['mt-5', TYPOGRAPHY[TEXT_ROLE.BODY], '[&>*+*]:mt-4'],
  variants: {
    contentAlignment: {
      [CONTENT_ALIGNMENT.LEFT]: ['text-left'],
      [CONTENT_ALIGNMENT.CENTER]: ['text-center'],
      [CONTENT_ALIGNMENT.RIGHT]: ['text-right'],
    },
  },
});

export type THeroBodyVariants = VariantProps<typeof heroBodyVariants>;
