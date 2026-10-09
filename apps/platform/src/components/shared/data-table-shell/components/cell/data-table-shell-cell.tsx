import type { ReactNode } from 'react';

import { dataTableShellVariants } from '../../data-table-shell-variants';

export type TDataTableShellCellProps = {
  children: ReactNode;
};

export const DataTableShellCell = ({ children }: TDataTableShellCellProps) => {
  const { cell } = dataTableShellVariants();

  return <td className={cell()}>{children}</td>;
};
