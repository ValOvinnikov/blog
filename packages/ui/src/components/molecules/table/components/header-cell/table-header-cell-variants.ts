import { TABLE_CELL_BORDER } from '@blog/ui/components/molecules/table/table-cell-border';
import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const tableHeaderCellVariants = tv({
  base: ['px-3 py-2', ...TABLE_CELL_BORDER, 'font-semibold'],
  variants: {
    isRowHeader: {
      true: ['align-top'],
      false: [
        'align-bottom',
        'bg-brand-primary-solid text-brand-primary-contrast',
        '[thead>tr:first-child>&]:first:rounded-tl-card [thead>tr:first-child>&]:last:rounded-tr-card',
        '[table:not(:has(tbody>tr))>thead>tr:last-child>&]:border-b-0',
        '[table:not(:has(tbody>tr))>thead>tr:last-child>&]:first:rounded-bl-card [table:not(:has(tbody>tr))>thead>tr:last-child>&]:last:rounded-br-card',
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
