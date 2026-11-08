import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import { tableHeaderCellVariants } from './table-header-cell-variants';

export type TTableHeaderCellProps = IWithClassName &
  IWithDataTestId & {
    children?: ReactNode;
  };

/** A column heading that screen readers announce with every cell beneath it. */
export const TableHeaderCell = ({
  className,
  dataTestId,
  children,
}: TTableHeaderCellProps) => (
  <th
    scope="col"
    className={tableHeaderCellVariants({ class: className })}
    data-testid={dataTestId}
  >
    {children}
  </th>
);
