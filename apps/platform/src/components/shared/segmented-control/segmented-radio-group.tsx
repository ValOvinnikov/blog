'use client';

import { RadioGroup } from '@base-ui/react/radio-group';
import {
  SEGMENTED_RADIO_LAYOUT,
  type TSegmentedRadioLayout,
} from '@platform/constants/segmented-control';
import { useTrackScroll } from '@platform/utils/use-track-scroll/use-track-scroll';
import type {
  TControlLock,
  TMaybeNull,
  TNamedControlAria,
} from '@shinefold/config';
import type { IWithClassName } from '@shinefold/config/types';
import { useId } from 'react';

import {
  SegmentedRadioOption,
  type TSegmentedRadioOption,
} from './components/segmented-radio-option/segmented-radio-option';
import { SelectedDescription } from './components/selected-description/selected-description';
import {
  SEGMENTED_FADE_WIDTH_PX,
  segmentedRadioGroupVariants,
} from './segmented-radio-group-variants';
import { useLockedArrowFocus } from './use-locked-arrow-focus';
import { useSelectedDescription } from './use-selected-description';

type TSegmentedRadioGroupProps<TValue extends string> = IWithClassName & {
  options: TSegmentedRadioOption<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
  aria: TNamedControlAria;
  lock?: TControlLock;
  layout?: TSegmentedRadioLayout;
};

export const SegmentedRadioGroup = <TValue extends string>({
  options,
  value,
  onChange,
  aria,
  lock = {},
  layout = SEGMENTED_RADIO_LAYOUT.TRACK,
  className,
}: TSegmentedRadioGroupProps<TValue>) => {
  const idPrefix = useId();
  const { label: ariaLabel, labelledBy, describedBy } = aria;
  const isTiles = layout === SEGMENTED_RADIO_LAYOUT.TILES;
  const { isLocked: isPlanLocked = false, isDisabled = false } = lock;
  const isLocked = isPlanLocked || isDisabled;
  const selectedIndex = options.findIndex(
    ({ value: optionValue }) => optionValue === value,
  );
  const { trackRef, setItemRef, onScroll, hasMoreStart, hasMoreEnd } =
    useTrackScroll<HTMLDivElement, HTMLButtonElement>({
      selectedIndex,
      fadeWidth: SEGMENTED_FADE_WIDTH_PX,
    });
  const { setOptionRef, onKeyDown } = useLockedArrowFocus(isLocked, {
    hasVerticalArrows: true,
  });
  const { descriptionId, description, groupDescribedBy } =
    useSelectedDescription(options, value, describedBy);
  const { root, track, fade, fadeStart, fadeEnd } = segmentedRadioGroupVariants(
    { layout },
  );

  const setRef = (index: number) => (node: TMaybeNull<HTMLButtonElement>) => {
    setItemRef(index)(node);
    setOptionRef(index)(node);
  };

  return (
    <div className={root({ class: className })}>
      <RadioGroup
        ref={trackRef}
        value={value}
        onValueChange={(nextValue: TValue) => onChange(nextValue)}
        readOnly={isLocked}
        aria-label={ariaLabel}
        aria-labelledby={labelledBy}
        aria-describedby={isTiles ? groupDescribedBy : describedBy}
        onScroll={onScroll}
        onKeyDown={onKeyDown}
        className={track()}
      >
        {options.map((option, index) => (
          <SegmentedRadioOption
            key={option.value}
            ref={setRef(index)}
            option={option}
            idPrefix={idPrefix}
            layout={layout}
            isSelected={option.value === value}
            isLocked={isLocked}
            isPlanLocked={isPlanLocked}
          />
        ))}
      </RadioGroup>
      {hasMoreStart ? (
        <span aria-hidden="true" className={fade({ class: fadeStart() })} />
      ) : null}
      {hasMoreEnd ? (
        <span aria-hidden="true" className={fade({ class: fadeEnd() })} />
      ) : null}
      {isTiles && (
        <SelectedDescription id={descriptionId} description={description} />
      )}
    </div>
  );
};
