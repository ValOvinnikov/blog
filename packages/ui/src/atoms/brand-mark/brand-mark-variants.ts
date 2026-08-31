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

/**
 * Uploaded logo image — a real-world logo is commonly non-square, so it's
 * never boxed into a fixed square. Default sizing bounds height and lets
 * width scale freely; `stacked` (mark rendered above a spec line) instead
 * spans the available width and caps height at `md` and above, matching the
 * breakpoint the spec line itself becomes visible at — below `md` the mark
 * always renders with the same sizing as the no-spec-line case.
 */
export const brandMarkImageVariants = tv({
  base: ['inline-block shrink-0 object-contain'],
  variants: {
    size: {
      [SIZE.SM]: ['h-5 w-auto'],
      [SIZE.MD]: ['h-7 w-auto'],
      [SIZE.LG]: ['h-9 w-auto'],
    },
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
