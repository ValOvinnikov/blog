import type { Table, TMaybeUndefined } from '@shinefold/config';
import { TABLE_COLUMN_WARNING_THRESHOLD } from '@shinefold/config/constants';

export const validateTableColumnCount = (
  table: TMaybeUndefined<Table>,
): string | true =>
  table?.rows?.some(
    ({ cells }) => (cells?.length ?? 0) >= TABLE_COLUMN_WARNING_THRESHOLD,
  )
    ? 'Readers on phones will scroll this table sideways. Consider fewer columns, or splitting it into two tables.'
    : true;
