import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { TCompoundChildren } from '@blog/ui/lib/react';
import { Children, cloneElement, isValidElement } from 'react';

import type { TableCell } from '../cell/table-cell';
import {
  TableHeaderCell,
  type TTableHeaderCellProps,
} from '../header-cell/table-header-cell';

type TTableRowChildren = TCompoundChildren<{
  HeaderCell: typeof TableHeaderCell;
  Cell: typeof TableCell;
}>;

export type TTableRowProps = IWithClassName &
  IWithDataTestId & {
    isHeadRow?: boolean;
    children?: TTableRowChildren | TTableRowChildren[];
  };

/** One row of header cells or data cells. */
export const TableRow = ({
  isHeadRow = false,
  className,
  dataTestId,
  children,
}: TTableRowProps) => (
  <tr className={className} data-testid={dataTestId}>
    {Children.map(children, (child) =>
      isValidElement<TTableHeaderCellProps>(child) &&
      child.type === TableHeaderCell
        ? cloneElement(child, { isColumnHeader: isHeadRow })
        : child,
    )}
  </tr>
);
