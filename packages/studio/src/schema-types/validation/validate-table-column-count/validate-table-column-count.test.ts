import type { Table } from '@blog/config';
import {
  PORTABLE_TEXT_BLOCK_TYPE,
  TABLE_COLUMN_WARNING_THRESHOLD,
} from '@blog/config/constants';
import { validateTableColumnCount } from '@blog/studio/schema-types/validation/validate-table-column-count/validate-table-column-count';

const WARNS = expect.any(String);

const tableWithRowWidths = (...widths: number[]): Table => ({
  _type: PORTABLE_TEXT_BLOCK_TYPE.TABLE,
  rows: widths.map((width, index) => ({
    _type: 'row',
    _key: `row-${index}`,
    cells: Array.from({ length: width }, (_, cellIndex) => ({
      _type: 'cell',
      _key: `cell-${index}-${cellIndex}`,
    })),
  })),
});

describe(validateTableColumnCount, () => {
  it.each([
    ['passes with no table', undefined, true],
    ['passes with no rows', { _type: PORTABLE_TEXT_BLOCK_TYPE.TABLE }, true],
    [
      'passes when every row is below the threshold',
      tableWithRowWidths(
        TABLE_COLUMN_WARNING_THRESHOLD - 1,
        TABLE_COLUMN_WARNING_THRESHOLD - 1,
      ),
      true,
    ],
    [
      'warns when a row reaches the threshold',
      tableWithRowWidths(TABLE_COLUMN_WARNING_THRESHOLD),
      WARNS,
    ],
    [
      'warns when only one row is wide',
      tableWithRowWidths(1, TABLE_COLUMN_WARNING_THRESHOLD + 1),
      WARNS,
    ],
  ])('%s', (_description, table, expected) => {
    expect(validateTableColumnCount(table)).toEqual(expected);
  });
});
