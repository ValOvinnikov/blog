import { dataTableShellVariants } from '@platform/components/shared/data-table-shell/data-table-shell-variants';
import type { ReactNode } from 'react';

export type TDataTableShellFooterProps = {
  children: ReactNode;
};

export const DataTableShellFooter = ({
  children,
}: TDataTableShellFooterProps) => {
  const { footer } = dataTableShellVariants();
  return <div className={footer()}>{children}</div>;
};
