import { dataTableShellVariants } from '@platform/components/shared/data-table-shell/data-table-shell-variants';
import type { ReactNode } from 'react';

export type TDataTableShellCellProps = {
  children: ReactNode;
};

export const DataTableShellCell = ({ children }: TDataTableShellCellProps) => {
  const { cell } = dataTableShellVariants();

  return <td className={cell()}>{children}</td>;
};
