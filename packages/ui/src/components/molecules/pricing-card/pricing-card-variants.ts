import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const pricingCardVariants = tv({
  slots: {
    root: [
      'relative grid grid-rows-[repeat(5,auto)_1fr_repeat(2,auto)]',
      // Inside `PricingCardGrid` (matched by its `data-pricing-card-grid`) the card adopts the grid's rows, so neighbouring tiers line up.
      'in-data-pricing-card-grid:row-span-8 in-data-pricing-card-grid:grid-rows-subgrid in-data-pricing-card-grid:mb-6',
      'item-card surface-card',
      'px-card-x py-card-y',
    ],
    highlight: ['row-start-1 h-4'],
    // The title's size container sits here because on the card its containment would stop the card subgridding.
    name: ['row-start-2 @container/card'],
    description: ['row-start-3 mt-2'],
    price: ['row-start-4 mt-4'],
    extras: ['row-start-5 mt-1 flex flex-col gap-1'],
    features: ['row-start-6 mt-5'],
    actions: ['row-start-7 mt-6'],
    footnote: ['row-start-8 mt-3'],
  },
  variants: {
    isHighlighted: {
      true: {
        root: [
          'border-brand-primary',
          '[--item-border-width:1px] [--item-accent-color:var(--brand-primary)] [--item-shadow:var(--shadow-card)]',
        ],
      },
      false: {},
    },
  },
  defaultVariants: { isHighlighted: false },
});

export type TPricingCardVariants = VariantProps<typeof pricingCardVariants>;
