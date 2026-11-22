import { dataTableShellVariants } from '@platform/components/shared/data-table-shell/data-table-shell-variants';
import type { ReactNode } from 'react';

export type TDataTableShellToolbarProps = {
  children: ReactNode;
};

export const DataTableShellToolbar = ({
  children,
}: TDataTableShellToolbarProps) => {
  const { toolbar } = dataTableShellVariants();

  return <div className={toolbar()}>{children}</div>;
};
