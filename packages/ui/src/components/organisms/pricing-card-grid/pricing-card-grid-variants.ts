import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const pricingCardGridVariants = tv({
  slots: {
    root: ['@container/pricing w-full'],
    grid: [
      'grid grid-cols-[minmax(0,24rem)] justify-center',
      // A row gap would also open between a card's empty rows, so cards space themselves with `mb-6`, cancelled here after the last row.
      'gap-x-4 gap-y-0 -mb-6 @3xl/pricing:gap-x-6',
    ],
  },
  variants: {
    // Each step is the narrowest container that keeps every tier at least ~11.25rem wide.
    columns: {
      1: {},
      2: { grid: ['@sm/pricing:grid-cols-2'] },
      3: { grid: ['@xl/pricing:grid-cols-3'] },
      4: { grid: ['@sm/pricing:grid-cols-2', '@4xl/pricing:grid-cols-4'] },
    },
  },
  defaultVariants: { columns: 3 },
});

export type TPricingCardGridVariants = VariantProps<
  typeof pricingCardGridVariants
>;
