import { renderElement, screen, within } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { Table } from './table';

faker.seed(6520);

const MOCK_REGION_LABEL = faker.lorem.words(3);
const MOCK_CAPTION = faker.lorem.sentence();
const MOCK_STRAY_TEXT = faker.lorem.words(3);
const COLUMNS = [faker.lorem.word(), faker.lorem.word()];
const ROWS = [
  [faker.lorem.words(2), faker.lorem.words(2)],
  [faker.lorem.words(2), faker.lorem.words(2)],
];

const renderTable = () =>
  renderElement(
    <Table ariaLabel={MOCK_REGION_LABEL}>
      <Table.Head>
        <Table.Row>
          {COLUMNS.map((column) => (
            <Table.HeaderCell key={column}>{column}</Table.HeaderCell>
          ))}
        </Table.Row>
      </Table.Head>
      {ROWS.map((cells) => (
        <Table.Row key={cells.join()}>
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

  it('wraps the table in a keyboard-focusable region named by its label', () => {
    const region = screen.getByRole('region', { name: MOCK_REGION_LABEL });

    const table = within(region).getByRole('table');

    expect(region).toHaveAttribute('tabindex', '0');
    expect(table).toBeVisible();
  });

  it.each(COLUMNS)('renders "%s" as a column header', (column) => {
    const header = screen.getByRole('columnheader', { name: column });

    expect(header).toHaveAttribute('scope', 'col');
  });

  it('keeps header rows apart from the data rows', () => {
    const [headGroup, bodyGroup] = screen.getAllByRole('rowgroup');
    const headers = within(headGroup!).getAllByRole('columnheader');
    const bodyRows = within(bodyGroup!).getAllByRole('row');

    expect(headers).toHaveLength(COLUMNS.length);
    expect(bodyRows).toHaveLength(ROWS.length);
  });

  it.each(ROWS.flat())('renders "%s" as a data cell', (cell) => {
    const dataCell = screen.getByRole('cell', { name: cell });

    expect(dataCell).toBeVisible();
  });
});

it('renders an unknown child inside the table body', () => {
  renderElement(
    <Table ariaLabel={MOCK_REGION_LABEL}>
      <tr>
        <td>{MOCK_STRAY_TEXT}</td>
      </tr>
    </Table>,
  );

  const strayCell = screen.getByRole('cell', { name: MOCK_STRAY_TEXT });

  expect(strayCell).toBeVisible();
});
