import { dataTableShellVariants } from '@platform/components/shared/data-table-shell/data-table-shell-variants';
import { ARIA_ROLE } from '@platform/constants/aria-role';
import { hasLength, isUndefined } from '@shinefold/utils/primitives';
import { Children, type ReactNode } from 'react';

export type TDataTableShellCellProps = {
  children: ReactNode;
  stackedLabel?: ReactNode;
};

export const DataTableShellCell = ({
  children,
  stackedLabel,
}: TDataTableShellCellProps) => {
  const { cell, stackedCellLabel } = dataTableShellVariants();

  if (isUndefined(stackedLabel)) {
    return <td className={cell()}>{children}</td>;
  }

  return (
    <td className={cell()} role={ARIA_ROLE.CELL}>
      {hasLength(Children.toArray(children)) && (
        <>
          <span className={stackedCellLabel()}>{stackedLabel}</span> {children}
        </>
      )}
    </td>
  );
};
