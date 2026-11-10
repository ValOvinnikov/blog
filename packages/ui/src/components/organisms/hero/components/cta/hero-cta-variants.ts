import { ALIGN_JUSTIFY, tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const heroCtaVariants = tv({
  base: ['mt-auto pt-[18px]', 'flex flex-wrap items-center gap-3'],
  variants: {
    contentAlignment: ALIGN_JUSTIFY,
  },
});

export type THeroCtaVariants = VariantProps<typeof heroCtaVariants>;
