import type { IWithClassName, IWithDataTestId } from '@shinefold/config';
import type { IWithChildren } from '@shinefold/config/react';

import { tableCellVariants } from './table-cell-variants';

export type TTableCellProps = IWithClassName & IWithDataTestId & IWithChildren;

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
