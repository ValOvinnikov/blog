import { Card } from '@platform/components/shared/card';
import type { ReactNode } from 'react';

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
  columns: TDataTableShellColumn[];
  renderRow: (item: TItem) => ReactNode;
  classNames: TDataTableShellClassNames;
};

export const DataTableShell = <TItem,>({
  items,
  emptyMessage,
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

  return (
    <Card className={classNames.card}>
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
    </Card>
  );
};
