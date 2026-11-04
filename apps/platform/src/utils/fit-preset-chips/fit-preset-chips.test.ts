import { fitPresetChips } from './fit-preset-chips';

const MOCK_CHIP_WIDTHS = [110, 136, 108, 104, 120];
const MOCK_MORE_WIDTH = 150;
const MOCK_GAP = 12;
const MOCK_EDIT_COLUMN_1440 = 472;
const MOCK_EDIT_COLUMN_1280 = 400;
const EDITORIAL_INDEX = 1;
const ALMANAC_INDEX = 4;

const fit = (
  available: number,
  selectedIndex: number,
  chipWidths = MOCK_CHIP_WIDTHS,
) =>
  fitPresetChips({
    available,
    chipWidths,
    moreWidth: MOCK_MORE_WIDTH,
    gap: MOCK_GAP,
    selectedIndex,
  });

describe(fitPresetChips, () => {
  it('shows every chip when they all fit', () => {
    const indices = fit(MOCK_EDIT_COLUMN_1280, EDITORIAL_INDEX, [110, 136]);

    expect(indices).toEqual([0, 1]);
  });

  it('keeps registry order while the selected chip is inside the cut', () => {
    const indices = fit(MOCK_EDIT_COLUMN_1440, EDITORIAL_INDEX);

    expect(indices).toEqual([0, 1]);
  });

  it('gives the last chip slot to a selected preset past the cut', () => {
    const indices = fit(MOCK_EDIT_COLUMN_1440, ALMANAC_INDEX);

    expect(indices).toEqual([0, ALMANAC_INDEX]);
  });

  it('shows only the selected chip when two do not fit beside the button', () => {
    const indices = fit(MOCK_EDIT_COLUMN_1280, EDITORIAL_INDEX);

    expect(indices).toEqual([EDITORIAL_INDEX]);
  });

  it('keeps the selected chip when not even one fits beside the button', () => {
    const indices = fit(0, ALMANAC_INDEX);

    expect(indices).toEqual([ALMANAC_INDEX]);
  });

  it('measures the selected chip in place of the one it replaces', () => {
    const wideSelected = [100, 100, 100, 100, 220];

    const indices = fit(MOCK_EDIT_COLUMN_1440, ALMANAC_INDEX, wideSelected);

    expect(indices).toEqual([ALMANAC_INDEX]);
  });
});
