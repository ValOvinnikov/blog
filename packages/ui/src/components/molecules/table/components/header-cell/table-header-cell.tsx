import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { IWithChildren } from '@blog/config/react';

import {
  tableHeaderCellVariants,
  type TTableHeaderCellVariants,
} from './table-header-cell-variants';

export type TTableHeaderCellProps = IWithClassName &
  IWithDataTestId &
  IWithChildren & {
    isColumnHeader?: TTableHeaderCellVariants['isColumnHeader'];
  };

/** A heading cell that screen readers announce with the cells it names: the column below it inside `Table.Head`, the rest of its row in the body. */
export const TableHeaderCell = ({
  isColumnHeader = false,
  className,
  dataTestId,
  children,
}: TTableHeaderCellProps) => (
  <th
    scope={isColumnHeader ? 'col' : 'row'}
    className={tableHeaderCellVariants({ isColumnHeader, class: className })}
    data-testid={dataTestId}
  >
    {children}
  </th>
);
