import { LOOK_ROW, type TLookRow } from '@platform/constants/look-row';

import {
  nextOpenRows,
  revealOpenRow,
  SITE_PARTS_ROWS,
  STYLE_ROWS,
} from './look-open-rows';

describe(nextOpenRows, () => {
  it.each<{
    title: string;
    openRows: TLookRow[];
    groupRows: readonly TLookRow[];
    nextGroupRows: TLookRow[];
    expected: TLookRow[];
  }>([
    {
      title: 'opens the first row on its own',
      openRows: [],
      groupRows: SITE_PARTS_ROWS,
      nextGroupRows: [LOOK_ROW.FOOTER],
      expected: [LOOK_ROW.FOOTER],
    },
    {
      title: 'folds the open row when another row opens in the same group',
      openRows: [LOOK_ROW.FOOTER],
      groupRows: SITE_PARTS_ROWS,
      nextGroupRows: [LOOK_ROW.FOOTER, LOOK_ROW.LANGUAGE_SWITCHER],
      expected: [LOOK_ROW.LANGUAGE_SWITCHER],
    },
    {
      title: 'folds the open row when a row opens in the other group',
      openRows: [LOOK_ROW.FOOTER],
      groupRows: STYLE_ROWS,
      nextGroupRows: [LOOK_ROW.COLOUR],
      expected: [LOOK_ROW.COLOUR],
    },
    {
      title: 'folds a row by hand and leaves the others as they were',
      openRows: [LOOK_ROW.COLOUR, LOOK_ROW.FOOTER],
      groupRows: STYLE_ROWS,
      nextGroupRows: [],
      expected: [LOOK_ROW.FOOTER],
    },
    {
      title: 'keeps several rows open when none newly opens',
      openRows: [LOOK_ROW.COLOUR, LOOK_ROW.BRAND, LOOK_ROW.FOOTER],
      groupRows: STYLE_ROWS,
      nextGroupRows: [LOOK_ROW.COLOUR, LOOK_ROW.BRAND],
      expected: [LOOK_ROW.COLOUR, LOOK_ROW.BRAND, LOOK_ROW.FOOTER],
    },
  ])('$title', ({ openRows, groupRows, nextGroupRows, expected }) => {
    const result = nextOpenRows(openRows, groupRows, nextGroupRows);

    expect(result).toEqual(expected);
  });
});

describe(revealOpenRow, () => {
  it('adds the row and keeps the rows already open', () => {
    const result = revealOpenRow([LOOK_ROW.COLOUR], LOOK_ROW.FOOTER);

    expect(result).toEqual([LOOK_ROW.COLOUR, LOOK_ROW.FOOTER]);
  });

  it('leaves the open rows as they were when the row is already open', () => {
    const result = revealOpenRow(
      [LOOK_ROW.COLOUR, LOOK_ROW.FOOTER],
      LOOK_ROW.COLOUR,
    );

    expect(result).toEqual([LOOK_ROW.COLOUR, LOOK_ROW.FOOTER]);
  });
});
