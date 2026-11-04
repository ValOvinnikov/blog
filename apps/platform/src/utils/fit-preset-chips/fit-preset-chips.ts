export type TPresetChipMeasure = {
  available: number;
  chipWidths: number[];
  moreWidth: number;
  gap: number;
  selectedIndex: number;
};

const spanOf = (widths: number[], gap: number): number =>
  widths.reduce((total, width) => total + width, 0) +
  gap * Math.max(widths.length - 1, 0);

const firstWithSelected = (count: number, selectedIndex: number): number[] => {
  const indices = Array.from({ length: count }, (_, index) => index);
  return selectedIndex < count
    ? indices
    : [...indices.slice(0, count - 1), selectedIndex];
};

export const fitPresetChips = ({
  available,
  chipWidths,
  moreWidth,
  gap,
  selectedIndex,
}: TPresetChipMeasure): number[] => {
  const widthAt = (index: number) => chipWidths[index] ?? 0;
  const all = chipWidths.map((_, index) => index);

  if (spanOf(chipWidths, gap) <= available) {
    return all;
  }

  for (let count = chipWidths.length - 1; count > 1; count -= 1) {
    const indices = firstWithSelected(count, selectedIndex);
    if (spanOf(indices.map(widthAt), gap) + gap + moreWidth <= available) {
      return indices;
    }
  }

  return [selectedIndex];
};
