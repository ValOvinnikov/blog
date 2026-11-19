import type { TDataTableShellCellProps } from '@platform/components/shared/data-table-shell/components/cell/data-table-shell-cell';
import { dataTableShellVariants } from '@platform/components/shared/data-table-shell/data-table-shell-variants';
import { ARIA_ROLE } from '@platform/constants/aria-role';
import { Children, cloneElement, isValidElement, type ReactNode } from 'react';

export type TDataTableShellRowProps = {
  children: ReactNode;
  stackedLabels?: ReactNode[];
};

export const DataTableShellRow = ({
  children,
  stackedLabels,
}: TDataTableShellRowProps) => {
  const { row } = dataTableShellVariants();

  if (!stackedLabels) {
    return <tr className={row()}>{children}</tr>;
  }

  return (
    <tr className={row()} role={ARIA_ROLE.ROW}>
      {Children.toArray(children).map((cell, index) =>
        isValidElement<TDataTableShellCellProps>(cell)
          ? cloneElement(cell, { stackedLabel: stackedLabels[index] })
          : cell,
      )}
    </tr>
  );
};
