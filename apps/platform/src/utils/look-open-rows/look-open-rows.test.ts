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
      nextGroupRows: ['footer'],
      expected: ['footer'],
    },
    {
      title: 'folds the open row when another row opens in the same group',
      openRows: ['footer'],
      groupRows: SITE_PARTS_ROWS,
      nextGroupRows: ['footer', 'languageSwitcher'],
      expected: ['languageSwitcher'],
    },
    {
      title: 'folds the open row when a row opens in the other group',
      openRows: ['footer'],
      groupRows: STYLE_ROWS,
      nextGroupRows: ['colour'],
      expected: ['colour'],
    },
    {
      title: 'folds a row by hand and leaves the others as they were',
      openRows: ['colour', 'footer'],
      groupRows: STYLE_ROWS,
      nextGroupRows: [],
      expected: ['footer'],
    },
    {
      title: 'keeps several rows open when none newly opens',
      openRows: ['colour', 'brand', 'footer'],
      groupRows: STYLE_ROWS,
      nextGroupRows: ['colour', 'brand'],
      expected: ['colour', 'brand', 'footer'],
    },
  ])('$title', ({ openRows, groupRows, nextGroupRows, expected }) => {
    const result = nextOpenRows(openRows, groupRows, nextGroupRows);

    expect(result).toEqual(expected);
  });
});

describe(revealOpenRow, () => {
  it('adds the row and keeps the rows already open', () => {
    const result = revealOpenRow(['colour'], 'footer');

    expect(result).toEqual(['colour', 'footer']);
  });

  it('leaves the open rows as they were when the row is already open', () => {
    const result = revealOpenRow(['colour', 'footer'], 'colour');

    expect(result).toEqual(['colour', 'footer']);
  });
});
