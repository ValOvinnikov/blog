import { render, screen } from '@platform/testing/custom-render';

import { DataTableShell } from './data-table-shell';

const classNames = {
  card: 'card-class',
  table: 'table-class',
  head: 'head-class',
  empty: 'empty-class',
};

type TItem = { id: string; name: string };

const noItems: TItem[] = [];
const twoItems: TItem[] = [
  { id: '1', name: 'Acme' },
  { id: '2', name: 'Globex' },
];

describe(`<${DataTableShell.name}/>`, () => {
  it('shows the empty message and no table when items is empty', () => {
    render(
      <DataTableShell
        items={noItems}
        emptyMessage="No rows yet."
        classNames={classNames}
        columns={[{ key: 'name', label: 'Name' }]}
        renderRow={(item) => <tr key={item.id}>{item.name}</tr>}
      />,
    );

    expect(screen.getByText('No rows yet.')).toBeVisible();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders a column header per column and one row per item via renderRow', () => {
    render(
      <DataTableShell
        items={twoItems}
        emptyMessage="No rows yet."
        classNames={classNames}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'actions', label: null },
        ]}
        renderRow={(item) => (
          <tr key={item.id}>
            <td>{item.name}</td>
          </tr>
        )}
      />,
    );

    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeVisible();
    expect(screen.getByText('Acme')).toBeVisible();
    expect(screen.getByText('Globex')).toBeVisible();
    expect(screen.queryByText('No rows yet.')).not.toBeInTheDocument();
  });
});
