'use client';

import { useDataTableShellStackedLabels } from '@platform/components/shared/data-table-shell/data-table-shell-stacked-context';
import { dataTableShellVariants } from '@platform/components/shared/data-table-shell/data-table-shell-variants';
import { ARIA_ROLE } from '@platform/constants/aria-role';
import { hasLength } from '@shinefold/utils/primitives';
import { Children, type ReactNode } from 'react';

export type TDataTableShellCellProps = {
  column?: string;
  children: ReactNode;
};

export const DataTableShellCell = ({
  column,
  children,
}: TDataTableShellCellProps) => {
  const stackedLabels = useDataTableShellStackedLabels();
  const { cell, stackedCellLabel } = dataTableShellVariants();

  if (!stackedLabels) {
    return <td className={cell()}>{children}</td>;
  }

  const label = column && stackedLabels[column];

  return (
    <td className={cell()} role={ARIA_ROLE.CELL}>
      {hasLength(Children.toArray(children)) && (
        <>
          {label && <span className={stackedCellLabel()}>{label}</span>}{' '}
          {children}
        </>
      )}
    </td>
  );
};
