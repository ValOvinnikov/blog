import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { TCompoundChildren } from '@blog/ui/lib/react';

import type { TableRow } from '../row/table-row';

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
    {children}
  </thead>
);
