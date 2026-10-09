import { Card } from '@platform/components/shared/card';
import type { ReactNode } from 'react';

import { dataTableShellVariants } from './data-table-shell-variants';

type TDataTableShellColumn = {
  key: string;
  label: ReactNode;
};

type TDataTableShellClassNames = {
  card: string;
  table: string;
  head: string;
  empty: string;
};

export type TDataTableShellProps<TItem> = {
  items: TItem[];
  emptyMessage: string;
  ariaLabel: string;
  columns: TDataTableShellColumn[];
  renderRow: (item: TItem) => ReactNode;
  classNames: TDataTableShellClassNames;
};

export const DataTableShell = <TItem,>({
  items,
  emptyMessage,
  ariaLabel,
  columns,
  renderRow,
  classNames,
}: TDataTableShellProps<TItem>) => {
  if (items.length === 0) {
    return (
      <Card className={classNames.card}>
        <Card.Body>
          <p className={classNames.empty}>{emptyMessage}</p>
        </Card.Body>
      </Card>
    );
  }

  const { scrollRegion } = dataTableShellVariants();

  return (
    <Card className={classNames.card}>
      {/* Focusable so Safari, which skips scroll containers, can scroll it by keyboard. */}
      <div
        className={scrollRegion()}
        role="region"
        aria-label={ariaLabel}
        tabIndex={0}
      >
        <table className={classNames.table}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th className={classNames.head} scope="col" key={column.key}>
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
