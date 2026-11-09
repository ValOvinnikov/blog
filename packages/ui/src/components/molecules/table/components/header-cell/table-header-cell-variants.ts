import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const tableHeaderCellVariants = tv({
  base: ['px-3 py-2', 'border border-divider', 'font-semibold'],
  variants: {
    isRowHeader: {
      true: ['align-top'],
      false: [
        'align-bottom',
        'bg-brand-primary-solid text-brand-primary-contrast',
      ],
    },
  },
  defaultVariants: {
    isRowHeader: false,
  },
});

export type TTableHeaderCellVariants = VariantProps<
  typeof tableHeaderCellVariants
>;
