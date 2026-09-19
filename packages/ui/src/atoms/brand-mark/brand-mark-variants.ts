import { SIZE } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

/** Polygon fallback mark — always drawn on a square viewBox, so a fixed square box never distorts it. */
export const brandMarkVariants = tv({
  base: ['inline-block shrink-0'],
  variants: {
    size: {
      [SIZE.SM]: ['size-5'],
      [SIZE.MD]: ['size-7'],
      [SIZE.LG]: ['size-9'],
    },
  },
  defaultVariants: {
    size: SIZE.MD,
  },
});

/** A real-world logo is commonly non-square, so it's never boxed into a fixed square. */
export const brandMarkImageVariants = tv({
  base: ['inline-block shrink-0 object-contain'],
  variants: {
    size: {
      [SIZE.SM]: ['h-5 w-auto'],
      [SIZE.MD]: ['h-7 w-auto'],
      [SIZE.LG]: ['h-9 w-auto'],
    },
    // The `md:` breakpoint here must match `brand-lockup-variants.ts`'s `tagline` (`hidden md:block`), since `stacked` only makes sense once the tagline it sits above is visible.
    stacked: {
      true: ['md:h-auto md:w-full md:max-h-9 md:object-left'],
    },
  },
  defaultVariants: {
    size: SIZE.MD,
  },
});

export type TBrandMarkVariants = VariantProps<typeof brandMarkVariants>;
export type TBrandMarkImageVariants = VariantProps<
  typeof brandMarkImageVariants
>;
