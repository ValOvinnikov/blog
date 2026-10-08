import { CARD_GAP, tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const cardGridVariants = tv({
  base: ['grid auto-rows-fr', CARD_GAP],
  variants: {
    columns: {
      1: ['grid-cols-1'],
      2: ['grid-cols-1 sm:grid-cols-2'],
      3: ['grid-cols-1 sm:grid-cols-2 md:grid-cols-3'],
      4: ['grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'],
    },
  },
  defaultVariants: { columns: 3 },
});

export type TCardGridVariants = VariantProps<typeof cardGridVariants>;
