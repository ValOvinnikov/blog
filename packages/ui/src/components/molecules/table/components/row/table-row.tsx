import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { TCompoundChildren } from '@blog/ui/lib/react';

import type { TableCell } from '../cell/table-cell';
import type { TableHeaderCell } from '../header-cell/table-header-cell';

export type TTableRowProps = IWithClassName &
  IWithDataTestId & {
    children?: TCompoundChildren<{
      HeaderCell: typeof TableHeaderCell;
      Cell: typeof TableCell;
    }>;
  };

/** One row of header cells or data cells. */
export const TableRow = ({
  className,
  dataTestId,
  children,
}: TTableRowProps) => (
  <tr className={className} data-testid={dataTestId}>
    {children}
  </tr>
);
