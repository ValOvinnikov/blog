import { faker } from '@faker-js/faker';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';

import { Table } from './table';

faker.seed(6520);

type TTableStoryRow = { id: string; cells: string[] };

const createColumns = (count: number) =>
  Array.from({ length: count }, () => faker.commerce.department());

const createRows = (
  columnCount: number,
  rowCount: number,
  createCell: () => string,
): TTableStoryRow[] =>
  Array.from({ length: rowCount }, () => ({
    id: faker.string.uuid(),
    cells: Array.from({ length: columnCount }, createCell),
  }));

const shortCell = () => faker.lorem.words(2);

const columns = createColumns(3);
const rows = createRows(columns.length, 4, shortCell);
const groupHeadings = [faker.lorem.word(), faker.lorem.word()];
const longRows = createRows(columns.length, 3, () => faker.lorem.sentences(3));
const wideColumns = createColumns(6);
const wideRows = createRows(wideColumns.length, 4, shortCell);

const renderHeaderRow = (headings: string[]) => (
  <Table.Row>
    {headings.map((heading) => (
      <Table.HeaderCell key={heading}>{heading}</Table.HeaderCell>
    ))}
  </Table.Row>
);

const renderBodyRows = (bodyRows: TTableStoryRow[]) =>
  bodyRows.map(({ id, cells }) => (
    <Table.Row key={id}>
      {cells.map((cell) => (
        <Table.Cell key={cell}>{cell}</Table.Cell>
      ))}
    </Table.Row>
  ));

const atPhoneWidth: Decorator = (Story) => (
  <div className="max-w-[390px] outline outline-dashed outline-divider">
    <Story />
  </div>
);

const meta = {
  title: 'Molecules/Table',
  component: Table,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    ariaLabel: faker.lorem.words(3),
  },
} satisfies Meta<typeof Table>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {
  args: {
    children: [
      <Table.Caption key="caption">{faker.lorem.sentence()}</Table.Caption>,
      <Table.Head key="head">{renderHeaderRow(columns)}</Table.Head>,
      renderBodyRows(rows),
    ],
  },
};

export const WithoutCaption: TStory = {
  args: {
    children: [
      <Table.Head key="head">{renderHeaderRow(columns)}</Table.Head>,
      renderBodyRows(rows),
    ],
  },
};

export const TwoHeaderRows: TStory = {
  args: {
    children: [
      <Table.Caption key="caption">{faker.lorem.sentence()}</Table.Caption>,
      <Table.Head key="head">
        {renderHeaderRow([...groupHeadings, faker.lorem.word()])}
        {renderHeaderRow(columns)}
      </Table.Head>,
      renderBodyRows(rows),
    ],
  },
};

export const LongContent: TStory = {
  args: {
    children: [
      <Table.Caption key="caption">{faker.lorem.sentence()}</Table.Caption>,
      <Table.Head key="head">{renderHeaderRow(columns)}</Table.Head>,
      renderBodyRows(longRows),
    ],
  },
};

export const WideTableAtPhoneWidth: TStory = {
  args: {
    children: [
      <Table.Caption key="caption">{faker.lorem.sentence()}</Table.Caption>,
      <Table.Head key="head">{renderHeaderRow(wideColumns)}</Table.Head>,
      renderBodyRows(wideRows),
    ],
  },
  decorators: [atPhoneWidth],
};
