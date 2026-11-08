import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { IWithChildren } from '@blog/config/react';

import {
  tableHeaderCellVariants,
  type TTableHeaderCellVariants,
} from './table-header-cell-variants';

export type TTableHeaderCellProps = IWithClassName &
  IWithDataTestId &
  IWithChildren & {
    isRowHeader?: TTableHeaderCellVariants['isRowHeader'];
  };

/** A heading cell that screen readers announce with the cells it names: the column below it, or the rest of its row when a body row marks it as a row header. */
export const TableHeaderCell = ({
  isRowHeader = false,
  className,
  dataTestId,
  children,
}: TTableHeaderCellProps) => (
  <th
    scope={isRowHeader ? 'row' : 'col'}
    className={tableHeaderCellVariants({ isRowHeader, class: className })}
    data-testid={dataTestId}
  >
    {children}
  </th>
);
