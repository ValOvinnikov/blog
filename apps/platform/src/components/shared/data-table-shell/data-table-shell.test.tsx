import { faker } from '@faker-js/faker';
import { SORT_DIRECTION } from '@platform/constants/sort';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import userEvent from '@testing-library/user-event';
import type { ComponentProps, ReactNode } from 'react';

import { DataTableShell } from './data-table-shell';

faker.seed(5995);

type TItem = { id: string; name: string };
type TColumn = ComponentProps<typeof DataTableShell<TItem>>['columns'][number];

const MOCK_EMPTY_MESSAGE = faker.lorem.sentence();
const MOCK_ARIA_LABEL = faker.lorem.word();
const MOCK_COLUMN_LABEL = faker.lorem.word();
const MOCK_FIRST_ITEM: TItem = {
  id: faker.string.uuid(),
  name: faker.company.name(),
};
const MOCK_SECOND_ITEM: TItem = {
  id: faker.string.uuid(),
  name: faker.company.name(),
};
const MOCK_ITEMS = [MOCK_FIRST_ITEM, MOCK_SECOND_ITEM];
const MOCK_TOOLBAR_LABEL = faker.lorem.words(2);
const MOCK_TOOLBAR = <button type="button">{MOCK_TOOLBAR_LABEL}</button>;

const renderTable = (
  items: TItem[],
  { sort, toolbar }: Pick<TColumn, 'sort'> & { toolbar?: ReactNode } = {},
) =>
  renderWithIntl(
    <DataTableShell
      items={items}
      emptyMessage={MOCK_EMPTY_MESSAGE}
      ariaLabel={MOCK_ARIA_LABEL}
      toolbar={toolbar}
      columns={[
        { key: 'name', label: MOCK_COLUMN_LABEL, sort },
        { key: 'actions', label: null },
      ]}
      renderRow={(item) => (
        <tr key={item.id}>
          <td>{item.name}</td>
        </tr>
      )}
    />,
  );

describe(`<${DataTableShell.name}/>`, () => {
  describe('with no items', () => {
    beforeEach(() => {
      renderTable([]);
    });

    it('shows the empty message', () => {
      const emptyMessage = screen.getByText(MOCK_EMPTY_MESSAGE);

      expect(emptyMessage).toBeVisible();
    });

    it('renders no table', () => {
      const table = screen.queryByRole('table');

      expect(table).not.toBeInTheDocument();
    });
  });

  describe('with items', () => {
    beforeEach(() => {
      renderTable(MOCK_ITEMS);
    });

    it('renders a header per labelled column', () => {
      const columnHeader = screen.getByRole('columnheader', {
        name: MOCK_COLUMN_LABEL,
      });

      expect(columnHeader).toBeVisible();
    });

    it.each([MOCK_FIRST_ITEM, MOCK_SECOND_ITEM])(
      'renders a row for $name',
      ({ name }) => {
        const cell = screen.getByRole('cell', { name });

        expect(cell).toBeVisible();
      },
    );

    it('hides the empty message', () => {
      const emptyMessage = screen.queryByText(MOCK_EMPTY_MESSAGE);

      expect(emptyMessage).not.toBeInTheDocument();
    });

    it('wraps the table in a named, keyboard-focusable scroll region', () => {
      const region = screen.getByRole('region', { name: MOCK_ARIA_LABEL });
      const table = screen.getByRole('table');

      expect(region).toContainElement(table);
      expect(region).toHaveAttribute('tabindex', '0');
    });
  });

  describe('with a sortable column', () => {
    const onSort = vi.fn();

    beforeEach(() => {
      onSort.mockReset();
    });

    it('marks the sorted column and asks to sort when its header is clicked', async () => {
      const user = userEvent.setup();
      renderTable(MOCK_ITEMS, {
        sort: { direction: SORT_DIRECTION.ASCENDING, onSort },
      });

      const header = screen.getByRole('columnheader', {
        name: MOCK_COLUMN_LABEL,
      });
      const sortButton = screen.getByRole('button', {
        name: MOCK_COLUMN_LABEL,
      });
      await user.click(sortButton);

      expect(header).toHaveAttribute('aria-sort', SORT_DIRECTION.ASCENDING);
      expect(onSort).toHaveBeenCalledOnce();
    });

    it('leaves an unsorted column without a sort state', () => {
      renderTable(MOCK_ITEMS, { sort: { direction: undefined, onSort } });

      const header = screen.getByRole('columnheader', {
        name: MOCK_COLUMN_LABEL,
      });

      expect(header).not.toHaveAttribute('aria-sort');
    });
  });

  it.each([
    ['above the rows', MOCK_ITEMS],
    ['above the empty message', []],
  ])('keeps the toolbar %s', (_, items) => {
    renderTable(items, { toolbar: MOCK_TOOLBAR });

    const toolbarControl = screen.getByRole('button', {
      name: MOCK_TOOLBAR_LABEL,
    });

    expect(toolbarControl).toBeVisible();
  });
});
