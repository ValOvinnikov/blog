import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const postGridVariants = tv({
  base: ['grid', 'gap-3.5'],
  variants: {
    columns: {
      1: ['grid-cols-1'],
      2: ['grid-cols-1 sm:grid-cols-2'],
      3: ['grid-cols-1 sm:grid-cols-2 md:grid-cols-3'],
    },
  },
  defaultVariants: { columns: 3 },
});

export type TPostGridVariants = VariantProps<typeof postGridVariants>;
