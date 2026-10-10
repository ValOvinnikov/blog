import type { ReactNode } from 'react';

import { dataTableShellVariants } from '../../data-table-shell-variants';

export type TDataTableShellRowProps = {
  children: ReactNode;
};

export const DataTableShellRow = ({ children }: TDataTableShellRowProps) => {
  const { row } = dataTableShellVariants();

  return <tr className={row()}>{children}</tr>;
};
