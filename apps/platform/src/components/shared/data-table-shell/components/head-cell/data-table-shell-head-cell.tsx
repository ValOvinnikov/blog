import {
  ICONS,
  SORT_DIRECTION,
  type TMaybeUndefined,
  type TSortDirection,
} from '@blog/config';
import { dataTableShellVariants } from '@platform/components/shared/data-table-shell/data-table-shell-variants';
import { Icon } from '@platform/components/shared/icon';
import type { ReactNode } from 'react';

export type TDataTableShellColumnSort = {
  direction: TMaybeUndefined<TSortDirection>;
  onSort: () => void;
};

export type TDataTableShellHeadCellProps = {
  label: ReactNode;
  sort?: TDataTableShellColumnSort;
};

export const DataTableShellHeadCell = ({
  label,
  sort,
}: TDataTableShellHeadCellProps) => {
  const { head, sortButton, sortIcon } = dataTableShellVariants();

  if (!sort) {
    return (
      <th className={head()} scope="col">
        {label}
      </th>
    );
  }

  const { direction, onSort } = sort;

  return (
    <th
      className={head({ isSortable: true })}
      scope="col"
      aria-sort={direction}
    >
      <button type="button" className={sortButton()} onClick={onSort}>
        {label}
        {direction && (
          <Icon
            name={ICONS.CHEVRON_DOWN}
            className={sortIcon({
              isAscending: direction === SORT_DIRECTION.ASCENDING,
            })}
          />
        )}
      </button>
    </th>
  );
};
