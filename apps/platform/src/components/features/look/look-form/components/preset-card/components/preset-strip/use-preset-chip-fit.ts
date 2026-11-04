import type { TMaybeNull, TMaybeUndefined } from '@blog/config';
import { isUndefined } from '@blog/utils/primitives';
import {
  fitPresetChips,
  type TPresetChipMeasure,
} from '@platform/utils/fit-preset-chips/fit-preset-chips';
import { useElementSize } from '@platform/utils/use-element-size/use-element-size';
import { useLayoutEffect, useState, type RefObject } from 'react';

import type { TPresetOption } from './preset-option';

type TMeasuredRow = Pick<
  TPresetChipMeasure,
  'chipWidths' | 'moreWidth' | 'gap'
>;

type TPresetChipFitArgs<TId extends string> = {
  rowRef: RefObject<TMaybeNull<HTMLElement>>;
  measureRef: RefObject<TMaybeNull<HTMLElement>>;
  presets: TPresetOption<TId>[];
  value: TId;
};

const CHIP_SELECTOR = '[role="radio"]';

const widthOf = (element: Element) => element.getBoundingClientRect().width;

const isSameRow = (
  previous: TMaybeUndefined<TMeasuredRow>,
  next: TMeasuredRow,
): boolean =>
  previous?.moreWidth === next.moreWidth &&
  previous.gap === next.gap &&
  previous.chipWidths.join() === next.chipWidths.join();

const measureRow = (element: HTMLElement): TMeasuredRow => {
  const more = element.lastElementChild;
  return {
    chipWidths: Array.from(element.querySelectorAll(CHIP_SELECTOR), widthOf),
    moreWidth: more ? widthOf(more) : 0,
    gap: Number.parseFloat(getComputedStyle(element).columnGap) || 0,
  };
};

export const usePresetChipFit = <TId extends string>({
  rowRef,
  measureRef,
  presets,
  value,
}: TPresetChipFitArgs<TId>): number[] => {
  const available = useElementSize(rowRef)?.width;
  const measuredWidth = useElementSize(measureRef)?.width;
  const [row, setRow] = useState<TMeasuredRow>();
  const presetIds = presets.map(({ id }) => id).join();

  useLayoutEffect(() => {
    const element = measureRef.current;
    if (!element) {
      return;
    }
    const next = measureRow(element);
    setRow((previous) => (isSameRow(previous, next) ? previous : next));
  }, [measureRef, presetIds, value, measuredWidth]);

  if (isUndefined(available) || isUndefined(row)) {
    return presets.map((_, index) => index);
  }

  return fitPresetChips({
    available,
    ...row,
    selectedIndex: Math.max(
      presets.findIndex(({ id }) => id === value),
      0,
    ),
  });
};
