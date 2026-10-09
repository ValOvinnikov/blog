import { Card } from '@platform/components/shared/card';
import type { TCompoundComponent } from '@platform/lib/react';
import type { ElementType, ReactNode } from 'react';

import { DataTableShellCell } from './components/cell/data-table-shell-cell';
import { DataTableShellRow } from './components/row/data-table-shell-row';
import { dataTableShellVariants } from './data-table-shell-variants';

const DataTableShellParts = {
  Row: DataTableShellRow,
  Cell: DataTableShellCell,
} satisfies Record<string, ElementType>;

type TDataTableShellColumn = {
  key: string;
  label: ReactNode;
};

type TDataTableShellProps<TItem> = {
  items: TItem[];
  emptyMessage: string;
  ariaLabel: string;
  columns: TDataTableShellColumn[];
  renderRow: (item: TItem) => ReactNode;
};

const DataTableShellRoot = <TItem,>({
  items,
  emptyMessage,
  ariaLabel,
  columns,
  renderRow,
}: TDataTableShellProps<TItem>) => {
  const { card, scrollRegion, table, head, empty } = dataTableShellVariants();

  if (items.length === 0) {
    return (
      <Card className={card()}>
        <Card.Body>
          <p className={empty()}>{emptyMessage}</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className={card()}>
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
              {columns.map((column) => (
                <th className={head()} scope="col" key={column.key}>
                  {column.label}
                </th>
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
