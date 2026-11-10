import {
  RADIUS_DECLARATIONS,
  RADIUS_SCALE,
  type TRadiusScale,
} from '@blog/config';
import { faker } from '@faker-js/faker';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties } from 'react';

import { Table } from './table';

faker.seed(6520);

type TTableStoryCell = { id: string; text: string };
type TTableStoryRow = { id: string; cells: TTableStoryCell[] };

const createCell = (text: string): TTableStoryCell => ({
  id: faker.string.uuid(),
  text,
});

const createColumns = (count: number) =>
  Array.from({ length: count }, () => createCell(faker.commerce.department()));

const createRows = (
  columnCount: number,
  rowCount: number,
  createText: () => string,
): TTableStoryRow[] =>
  Array.from({ length: rowCount }, () => ({
    id: faker.string.uuid(),
    cells: Array.from({ length: columnCount }, () => createCell(createText())),
  }));

const shortCell = () => faker.lorem.words(2);

const columns = createColumns(3);
const rows = createRows(columns.length, 4, shortCell);
const groupHeadings = createColumns(2);
const longRows = createRows(columns.length, 3, () => faker.lorem.sentences(3));
const wideColumns = createColumns(6);
const wideRows = createRows(wideColumns.length, 4, shortCell);
const sparseColumns = createColumns(5);
const sparseRows = createRows(
  sparseColumns.length,
  4,
  () => faker.helpers.maybe(shortCell, { probability: 0.4 }) ?? '',
);
const secondHeaderRow = createColumns(columns.length);

const renderHeaderRow = (headings: TTableStoryCell[]) => (
  <Table.Row>
    {headings.map(({ id, text }) => (
      <Table.HeaderCell key={id}>{text}</Table.HeaderCell>
    ))}
  </Table.Row>
);

const renderBodyRows = (bodyRows: TTableStoryRow[]) =>
  bodyRows.map(({ id, cells }) => (
    <Table.Row key={id}>
      {cells.map(({ id, text }) => (
        <Table.Cell key={id}>{text}</Table.Cell>
      ))}
    </Table.Row>
  ));

const renderBodyRowsWithHeaders = (bodyRows: TTableStoryRow[]) =>
  bodyRows.map(({ id, cells: [rowHeading, ...cells] }) => (
    <Table.Row key={id}>
      {rowHeading && <Table.HeaderCell>{rowHeading.text}</Table.HeaderCell>}
      {cells.map(({ id, text }) => (
        <Table.Cell key={id}>{text}</Table.Cell>
      ))}
    </Table.Row>
  ));

const atPhoneWidth: Decorator = (Story) => (
  <div className="max-w-[390px] outline outline-dashed outline-divider">
    <Story />
  </div>
);

const atRadiusScale = (radiusScale: TRadiusScale): Decorator => {
  const radii = RADIUS_DECLARATIONS[radiusScale];
  const style = { ...radii, '--radius-card': radii['--radius-md'] };

  const AtRadiusScale: Decorator = (Story) => (
    <div style={style as CSSProperties}>
      <Story />
    </div>
  );

  return AtRadiusScale;
};

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
        {renderHeaderRow([...groupHeadings, createCell(faker.lorem.word())])}
        {renderHeaderRow(columns)}
      </Table.Head>,
      renderBodyRows(rows),
    ],
  },
};

export const RowHeaders: TStory = {
  args: {
    children: [
      <Table.Caption key="caption">{faker.lorem.sentence()}</Table.Caption>,
      <Table.Head key="head">{renderHeaderRow(columns)}</Table.Head>,
      renderBodyRowsWithHeaders(rows),
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

export const EmptyCellsAtPhoneWidth: TStory = {
  args: {
    children: [
      <Table.Caption key="caption">{faker.lorem.sentence()}</Table.Caption>,
      <Table.Head key="head">{renderHeaderRow(sparseColumns)}</Table.Head>,
      renderBodyRows(sparseRows),
    ],
  },
  decorators: [atPhoneWidth],
};

export const LongContentAtPhoneWidth: TStory = {
  ...LongContent,
  decorators: [atPhoneWidth],
};

export const SmallRadius: TStory = {
  ...Default,
  decorators: [atRadiusScale(RADIUS_SCALE.SM)],
};

export const ExtraLargeRadius: TStory = {
  ...Default,
  decorators: [atRadiusScale(RADIUS_SCALE.XL)],
};

export const HeaderRowsOnlyAtExtraLargeRadius: TStory = {
  args: {
    children: [
      <Table.Head key="head">
        {renderHeaderRow(columns)}
        {renderHeaderRow(secondHeaderRow)}
      </Table.Head>,
    ],
  },
  decorators: [atRadiusScale(RADIUS_SCALE.XL)],
};

export const WideTableAtPhoneWidthAtExtraLargeRadius: TStory = {
  ...WideTableAtPhoneWidth,
  decorators: [atPhoneWidth, atRadiusScale(RADIUS_SCALE.XL)],
};

export const ExtraLargeRadiusInDarkMode: TStory = {
  ...ExtraLargeRadius,
  globals: { theme: 'dark' },
};

export const DefaultInDarkMode: TStory = {
  ...Default,
  globals: { theme: 'dark' },
};

export const RowHeadersInDarkMode: TStory = {
  ...RowHeaders,
  globals: { theme: 'dark' },
};

export const WideTableAtPhoneWidthInDarkMode: TStory = {
  ...WideTableAtPhoneWidth,
  globals: { theme: 'dark' },
};

export const EmptyCellsAtPhoneWidthInDarkMode: TStory = {
  ...EmptyCellsAtPhoneWidth,
  globals: { theme: 'dark' },
};

export const LongContentAtPhoneWidthInDarkMode: TStory = {
  ...LongContentAtPhoneWidth,
  globals: { theme: 'dark' },
};
