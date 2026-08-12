import { Size } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

/** Polygon fallback mark — always drawn on a square viewBox, so a fixed square box never distorts it. */
export const brandMarkVariants = tv({
  base: ['inline-block shrink-0'],
  variants: {
    size: {
      [Size.SM]: ['size-5'],
      [Size.MD]: ['size-7'],
      [Size.LG]: ['size-9'],
    },
  },
  defaultVariants: {
    size: Size.MD,
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
      [Size.SM]: ['h-5 w-auto'],
      [Size.MD]: ['h-7 w-auto'],
      [Size.LG]: ['h-9 w-auto'],
    },
    stacked: {
      true: ['md:h-auto md:w-full md:max-h-9 md:object-left'],
    },
  },
  defaultVariants: {
    size: Size.MD,
  },
});

export type TBrandMarkVariants = VariantProps<typeof brandMarkVariants>;
export type TBrandMarkImageVariants = VariantProps<
  typeof brandMarkImageVariants
>;
