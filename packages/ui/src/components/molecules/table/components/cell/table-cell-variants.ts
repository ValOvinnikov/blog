import { TABLE_CELL_BORDER } from '@shinefold/ui/components/molecules/table/table-cell-border';
import { tv } from '@shinefold/ui/lib/styling';

export const tableCellVariants = tv({
  base: ['not-empty:min-w-[10ch] px-3 py-2 align-top', ...TABLE_CELL_BORDER],
});
