import { Card } from '@platform/components/shared/card';
import type { TCompoundComponent } from '@platform/lib/react';
import type { ElementType, ReactNode } from 'react';

import { DataTableShellCell } from './components/cell/data-table-shell-cell';
import {
  DataTableShellHeadCell,
  type TDataTableShellColumnSort,
} from './components/head-cell/data-table-shell-head-cell';
import { DataTableShellRow } from './components/row/data-table-shell-row';
import { dataTableShellVariants } from './data-table-shell-variants';

const DataTableShellParts = {
  Row: DataTableShellRow,
  Cell: DataTableShellCell,
} satisfies Record<string, ElementType>;

type TDataTableShellColumn = {
  key: string;
  label: ReactNode;
  sort?: TDataTableShellColumnSort;
};

type TDataTableShellProps<TItem> = {
  items: TItem[];
  emptyMessage: string;
  ariaLabel: string;
  columns: TDataTableShellColumn[];
  renderRow: (item: TItem) => ReactNode;
  toolbar?: ReactNode;
};

const DataTableShellRoot = <TItem,>({
  items,
  emptyMessage,
  ariaLabel,
  columns,
  renderRow,
  toolbar,
}: TDataTableShellProps<TItem>) => {
  const {
    card,
    toolbar: toolbarSlot,
    scrollRegion,
    table,
    empty,
  } = dataTableShellVariants();
  const toolbarStrip = toolbar ? (
    <div className={toolbarSlot()}>{toolbar}</div>
  ) : undefined;

  if (items.length === 0) {
    return (
      <Card className={card()}>
        {toolbarStrip}
        <p className={empty()}>{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <Card className={card()}>
      {toolbarStrip}
      {/* Focusable so Safari, which skips scroll containers, can scroll it by keyboard. */}
      <div
        className={scrollRegion()}
        role="region"
        aria-label={ariaLabel}
        tabIndex={0}
      >
        <table className={table()}>
          <thead>
            <tr>
              {columns.map(({ key, label, sort }) => (
                <DataTableShellHeadCell key={key} label={label} sort={sort} />
              ))}
            </tr>
          </thead>
          <tbody>{items.map(renderRow)}</tbody>
        </table>
      </div>
    </Card>
  );
};

export const DataTableShell: TCompoundComponent<
  typeof DataTableShellRoot,
  typeof DataTableShellParts
> = Object.assign(DataTableShellRoot, DataTableShellParts);
