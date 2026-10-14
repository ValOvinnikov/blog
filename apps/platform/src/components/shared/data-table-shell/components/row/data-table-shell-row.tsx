import { dataTableShellVariants } from '@platform/components/shared/data-table-shell/data-table-shell-variants';
import type { ReactNode } from 'react';

export type TDataTableShellRowProps = {
  children: ReactNode;
};

export const DataTableShellRow = ({ children }: TDataTableShellRowProps) => {
  const { row } = dataTableShellVariants();

  return <tr className={row()}>{children}</tr>;
};
