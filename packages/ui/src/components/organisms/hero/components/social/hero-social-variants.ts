import { ALIGN_JUSTIFY, tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const heroSocialVariants = tv({
  base: ['flex flex-wrap gap-2', 'pt-[18px]'],
  variants: {
    contentAlignment: ALIGN_JUSTIFY,
  },
});

export type THeroSocialVariants = VariantProps<typeof heroSocialVariants>;
