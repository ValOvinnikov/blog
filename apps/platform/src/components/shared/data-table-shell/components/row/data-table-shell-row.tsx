'use client';

import { useDataTableShellStackedLabels } from '@platform/components/shared/data-table-shell/data-table-shell-stacked-context';
import { dataTableShellVariants } from '@platform/components/shared/data-table-shell/data-table-shell-variants';
import { ARIA_ROLE } from '@platform/constants/aria-role';
import type { ReactNode } from 'react';

export type TDataTableShellRowProps = {
  children: ReactNode;
};

export const DataTableShellRow = ({ children }: TDataTableShellRowProps) => {
  const stackedLabels = useDataTableShellStackedLabels();
  const { row } = dataTableShellVariants();

  return (
    <tr className={row()} role={stackedLabels && ARIA_ROLE.ROW}>
      {children}
    </tr>
  );
};
