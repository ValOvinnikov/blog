import { renderElement, screen, within } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent from '@testing-library/user-event';

import { Table } from './table';

faker.seed(6520);

const MOCK_REGION_LABEL = faker.lorem.words(3);
const MOCK_CAPTION = faker.lorem.sentence();
const MOCK_COLUMNS = [faker.lorem.word(), faker.lorem.word()];
const MOCK_ROWS = [
  [faker.lorem.words(2), faker.lorem.words(2)],
  [faker.lorem.words(2), faker.lorem.words(2)],
];

const renderTable = () =>
  renderElement(
    <Table ariaLabel={MOCK_REGION_LABEL}>
      <Table.Head>
        <Table.Row>
          {MOCK_COLUMNS.map((column) => (
            <Table.HeaderCell key={column}>{column}</Table.HeaderCell>
          ))}
        </Table.Row>
      </Table.Head>
      {MOCK_ROWS.map(([rowHeading, ...cells]) => (
        <Table.Row key={rowHeading}>
          <Table.HeaderCell>{rowHeading}</Table.HeaderCell>
          {cells.map((cell) => (
            <Table.Cell key={cell}>{cell}</Table.Cell>
          ))}
        </Table.Row>
      ))}
      <Table.Caption>{MOCK_CAPTION}</Table.Caption>
    </Table>,
  );

describe(`<${Table.name}/>`, () => {
  beforeEach(() => {
    renderTable();
  });

  it('names the table with its caption', () => {
    const table = screen.getByRole('table', { name: MOCK_CAPTION });

    expect(table).toBeVisible();
  });

  it('wraps the table in a keyboard-focusable region named by its label', async () => {
    const user = userEvent.setup();
    const region = screen.getByRole('region', { name: MOCK_REGION_LABEL });
    const table = within(region).getByRole('table');

    await user.tab();

    expect(region).toHaveFocus();
    expect(table).toBeVisible();
  });

  it.each(MOCK_COLUMNS)('renders "%s" as a column header', (column) => {
    const header = screen.getByRole('columnheader', { name: column });

    expect(header).toBeVisible();
  });

  it.each(MOCK_ROWS.map(([rowHeading]) => rowHeading))(
    'renders "%s" in a body row as a row header',
    (rowHeading) => {
      const header = screen.getByRole('rowheader', { name: rowHeading });

      expect(header).toBeVisible();
    },
  );

  it('keeps header rows apart from the data rows', () => {
    const [headGroup, bodyGroup] = screen.getAllByRole('rowgroup');
    const headers = within(headGroup!).getAllByRole('columnheader');
    const bodyRows = within(bodyGroup!).getAllByRole('row');

    expect(headers).toHaveLength(MOCK_COLUMNS.length);
    expect(bodyRows).toHaveLength(MOCK_ROWS.length);
  });

  it.each(MOCK_ROWS.flatMap(([, ...cells]) => cells))(
    'renders "%s" as a data cell',
    (cell) => {
      const dataCell = screen.getByRole('cell', { name: cell });

      expect(dataCell).toBeVisible();
    },
  );
});
