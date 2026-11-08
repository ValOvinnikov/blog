import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const tableHeaderCellVariants = tv({
  base: ['min-w-32 px-3 py-2', 'font-semibold'],
  variants: {
    isRowHeader: {
      true: ['align-top', 'border-b border-divider'],
      false: ['align-bottom', 'border-b-2 border-border-strong'],
    },
  },
  defaultVariants: {
    isRowHeader: false,
  },
});

export type TTableHeaderCellVariants = VariantProps<
  typeof tableHeaderCellVariants
>;
