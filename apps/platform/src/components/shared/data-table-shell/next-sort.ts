import { SORT_DIRECTION } from '@shinefold/config';
import type { TColumnSort } from '@shinefold/config/types';

export const nextSort = <TColumn>(
  current: TColumnSort<TColumn>,
  column: TColumn,
): TColumnSort<TColumn> => {
  if (current.column !== column) {
    return { column, direction: SORT_DIRECTION.ASCENDING };
  }

  return {
    column,
    direction:
      current.direction === SORT_DIRECTION.ASCENDING
        ? SORT_DIRECTION.DESCENDING
        : SORT_DIRECTION.ASCENDING,
  };
};
