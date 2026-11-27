import { LOOK_ROW, type TLookRow } from '@platform/constants/look-row';

import { nextOpenRows, revealOpenRow } from './look-open-rows';

describe(nextOpenRows, () => {
  it.each<{
    title: string;
    openRows: TLookRow[];
    nextRows: TLookRow[];
    expected: TLookRow[];
  }>([
    {
      title: 'opens the first row on its own',
      openRows: [],
      nextRows: [LOOK_ROW.FOOTER],
      expected: [LOOK_ROW.FOOTER],
    },
    {
      title: 'folds the open row when another row opens',
      openRows: [LOOK_ROW.FOOTER],
      nextRows: [LOOK_ROW.FOOTER, LOOK_ROW.DETAILS],
      expected: [LOOK_ROW.DETAILS],
    },
    {
      title: 'folds a row by hand and leaves the others as they were',
      openRows: [LOOK_ROW.COLOUR, LOOK_ROW.FOOTER],
      nextRows: [LOOK_ROW.FOOTER],
      expected: [LOOK_ROW.FOOTER],
    },
  ])('$title', ({ openRows, nextRows, expected }) => {
    const result = nextOpenRows(openRows, nextRows);

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
