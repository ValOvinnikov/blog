import { faker } from '@faker-js/faker';
import { renderWithIntl, screen } from '@platform/testing/custom-render';

import { DataTableShell } from './data-table-shell';

faker.seed(5995);

type TItem = { id: string; name: string };

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

const renderTable = (items: TItem[]) =>
  renderWithIntl(
    <DataTableShell
      items={items}
      emptyMessage={MOCK_EMPTY_MESSAGE}
      ariaLabel={MOCK_ARIA_LABEL}
      columns={[
        { key: 'name', label: MOCK_COLUMN_LABEL },
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
});
