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
const oneItem: TItem[] = [{ id: '1', name: 'Acme' }];
const twoItems: TItem[] = [
  { id: '1', name: 'Acme' },
  { id: '2', name: 'Globex' },
];

describe(DataTableShell, () => {
  it('shows the empty message and no table when items is empty', () => {
    const { container } = render(
      <DataTableShell
        items={noItems}
        emptyMessage="No rows yet."
        classNames={classNames}
        columns={[{ key: 'name', label: 'Name' }]}
        renderRow={(item) => <tr key={item.id}>{item.name}</tr>}
      />,
    );

    expect(screen.getByText('No rows yet.')).toBeVisible();
    expect(container.querySelector('table')).toBeNull();
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

  it('applies the given classNames to the card, table, header cells and empty message', () => {
    const { container: emptyContainer } = render(
      <DataTableShell
        items={noItems}
        emptyMessage="No rows yet."
        classNames={classNames}
        columns={[]}
        renderRow={() => null}
      />,
    );
    expect(emptyContainer.querySelector('.card-class')).not.toBeNull();
    expect(emptyContainer.querySelector('.empty-class')).not.toBeNull();

    const { container } = render(
      <DataTableShell
        items={oneItem}
        emptyMessage="No rows yet."
        classNames={classNames}
        columns={[{ key: 'name', label: 'Name' }]}
        renderRow={(item) => <tr key={item.id}>{item.name}</tr>}
      />,
    );
    expect(container.querySelector('table.table-class')).not.toBeNull();
    expect(container.querySelector('th.head-class')).not.toBeNull();
  });
});
