import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import { tableCellVariants } from './table-cell-variants';

export type TTableCellProps = IWithClassName &
  IWithDataTestId & {
    children?: ReactNode;
  };

/** A data cell, read with the heading of its column. */
export const TableCell = ({
  className,
  dataTestId,
  children,
}: TTableCellProps) => (
  <td
    className={tableCellVariants({ class: className })}
    data-testid={dataTestId}
  >
    {children}
  </td>
);
