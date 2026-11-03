import { SAMPLE_PART } from '@platform/constants/sample-part';

import {
  nextOpenRows,
  revealOpenRow,
  SITE_PARTS_ROWS,
  STYLE_ROWS,
  type TLookRowKey,
} from './look-open-rows';

describe(nextOpenRows, () => {
  it.each<{
    title: string;
    openRows: TLookRowKey[];
    groupRows: readonly TLookRowKey[];
    nextGroupRows: TLookRowKey[];
    expected: TLookRowKey[];
  }>([
    {
      title: 'opens the first row on its own',
      openRows: [],
      groupRows: SITE_PARTS_ROWS,
      nextGroupRows: [SAMPLE_PART.FOOTER],
      expected: [SAMPLE_PART.FOOTER],
    },
    {
      title: 'folds the open row when another row opens in the same group',
      openRows: [SAMPLE_PART.FOOTER],
      groupRows: SITE_PARTS_ROWS,
      nextGroupRows: [SAMPLE_PART.FOOTER, 'languageSwitcher'],
      expected: ['languageSwitcher'],
    },
    {
      title: 'folds the open row when a row opens in the other group',
      openRows: [SAMPLE_PART.FOOTER],
      groupRows: STYLE_ROWS,
      nextGroupRows: ['colour'],
      expected: ['colour'],
    },
    {
      title: 'folds a row by hand and leaves the others as they were',
      openRows: ['colour', SAMPLE_PART.FOOTER],
      groupRows: STYLE_ROWS,
      nextGroupRows: [],
      expected: [SAMPLE_PART.FOOTER],
    },
    {
      title: 'keeps several rows open when none newly opens',
      openRows: ['colour', 'brand', SAMPLE_PART.FOOTER],
      groupRows: STYLE_ROWS,
      nextGroupRows: ['colour', 'brand'],
      expected: ['colour', 'brand', SAMPLE_PART.FOOTER],
    },
  ])('$title', ({ openRows, groupRows, nextGroupRows, expected }) => {
    const result = nextOpenRows(openRows, groupRows, nextGroupRows);

    expect(result).toEqual(expected);
  });
});

describe(revealOpenRow, () => {
  it('adds the row and keeps the rows already open', () => {
    const result = revealOpenRow(['colour'], SAMPLE_PART.FOOTER);

    expect(result).toEqual(['colour', SAMPLE_PART.FOOTER]);
  });

  it('leaves the open rows as they were when the row is already open', () => {
    const result = revealOpenRow(['colour', SAMPLE_PART.FOOTER], 'colour');

    expect(result).toEqual(['colour', SAMPLE_PART.FOOTER]);
  });
});
