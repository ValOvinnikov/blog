import { faker } from '@faker-js/faker';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import { SORT_DIRECTION } from '@shinefold/config/constants';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import { DataTableShell } from './data-table-shell';

faker.seed(5995);

type TItem = { id: string; name: string };
type TShellProps = ComponentProps<typeof DataTableShell<TItem>>;
type TColumn = TShellProps['columns'][number];

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
const MOCK_TITLE_ID = faker.lorem.slug();
const MOCK_TITLE = faker.lorem.words(2);
const MOCK_COUNT = faker.lorem.words(2);
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();
const MOCK_NOTE = faker.lorem.sentence();
const MOCK_ACTIONS_LABEL = faker.lorem.word();

const renderStackedTable = () =>
  renderWithIntl(
    <DataTableShell
      items={MOCK_ITEMS}
      emptyMessage={MOCK_EMPTY_MESSAGE}
      ariaLabel={MOCK_ARIA_LABEL}
      isStacked={true}
      columns={[
        { key: 'name', label: MOCK_COLUMN_LABEL },
        { key: 'actions', label: MOCK_ACTIONS_LABEL },
      ]}
      renderRow={(item) => (
        <DataTableShell.Row key={item.id}>
          <DataTableShell.Cell>{item.name}</DataTableShell.Cell>
          <DataTableShell.Cell>{null}</DataTableShell.Cell>
        </DataTableShell.Row>
      )}
    />,
  );

const renderTable = (
  items: TItem[],
  {
    sort,
    children,
  }: Pick<TColumn, 'sort'> & Pick<TShellProps, 'children'> = {},
) =>
  renderWithIntl(
    <DataTableShell
      items={items}
      emptyMessage={MOCK_EMPTY_MESSAGE}
      ariaLabel={MOCK_ARIA_LABEL}
      columns={[
        { key: 'name', label: MOCK_COLUMN_LABEL, sort },
        { key: 'actions', label: null },
      ]}
      renderRow={(item) => (
        <tr key={item.id}>
          <td>{item.name}</td>
        </tr>
      )}
    >
      {children}
    </DataTableShell>,
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

  describe('stacked', () => {
    beforeEach(() => {
      renderStackedTable();
    });

    it.each([MOCK_FIRST_ITEM, MOCK_SECOND_ITEM])(
      'names the cell for $name after its column',
      ({ name }) => {
        const cell = screen.getByRole('cell', {
          name: `${MOCK_COLUMN_LABEL} ${name}`,
        });

        expect(cell).toBeInTheDocument();
      },
    );

    it('leaves an empty cell unlabelled, naming its column only in the head row', () => {
      const actionsLabels = screen.getAllByText(MOCK_ACTIONS_LABEL);
      const actionsHeader = screen.getByRole('columnheader', {
        name: MOCK_ACTIONS_LABEL,
      });

      expect(actionsLabels).toEqual([actionsHeader]);
    });
  });

  describe('with a sortable column', () => {
    const onSort = vi.fn();
    let user: UserEvent;

    beforeEach(() => {
      onSort.mockReset();
      user = userEvent.setup();
    });

    it('marks the sorted column and asks to sort when its header is clicked', async () => {
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

  describe.each([
    ['above the rows', MOCK_ITEMS],
    ['above the empty message', []],
  ])('with every opt-in part %s', (_, items) => {
    beforeEach(() => {
      renderTable(items, {
        children: (
          <>
            <DataTableShell.Title
              id={MOCK_TITLE_ID}
              count={MOCK_COUNT}
              supportingText={MOCK_SUPPORTING_TEXT}
            >
              {MOCK_TITLE}
            </DataTableShell.Title>
            <DataTableShell.Toolbar>
              <button type="button">{MOCK_TOOLBAR_LABEL}</button>
            </DataTableShell.Toolbar>
            <DataTableShell.Note>{MOCK_NOTE}</DataTableShell.Note>
          </>
        ),
      });
    });

    it('names the card after a focusable title heading', () => {
      const heading = screen.getByRole('heading', { name: MOCK_TITLE });
      const card = screen.getByRole('region', { name: MOCK_TITLE });

      expect(heading).toHaveAttribute('id', MOCK_TITLE_ID);
      expect(heading).toHaveAttribute('tabindex', '-1');
      expect(card).toContainElement(heading);
    });

    it.each([
      ['count', MOCK_COUNT],
      ['supporting line', MOCK_SUPPORTING_TEXT],
      ['note', MOCK_NOTE],
    ])('shows the %s', (_part, text) => {
      const shown = screen.getByText(text);

      expect(shown).toBeVisible();
    });

    it('keeps the toolbar', () => {
      const toolbarControl = screen.getByRole('button', {
        name: MOCK_TOOLBAR_LABEL,
      });

      expect(toolbarControl).toBeVisible();
    });
  });
});
