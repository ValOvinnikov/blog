import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { TCompoundChildren } from '@blog/ui/lib/react';
import { Children, cloneElement, isValidElement } from 'react';

import { TableRow, type TTableRowProps } from '../row/table-row';

export type TTableHeadProps = IWithClassName &
  IWithDataTestId & {
    children?: TCompoundChildren<{ Row: typeof TableRow }>;
  };

/** The table's header rows, whose cells name the columns below them. */
export const TableHead = ({
  className,
  dataTestId,
  children,
}: TTableHeadProps) => (
  <thead className={className} data-testid={dataTestId}>
    {Children.map(children, (child) =>
      isValidElement<TTableRowProps>(child) && child.type === TableRow
        ? cloneElement(child, { isHeadRow: true })
        : child,
    )}
  </thead>
);
