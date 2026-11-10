'use client';

import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import type { TControlAria } from '@blog/config';
import {
  SEGMENTED_OPTION_WIDTH,
  type TSegmentedOptionWidth,
} from '@platform/constants/segmented-control';
import { joinIds } from '@platform/utils/join-ids/join-ids';
import { singleSelectToggleGroupProps } from '@platform/utils/single-select-toggle-group/single-select-toggle-group';
import { useId, type ReactNode } from 'react';

import { segmentedControlVariants } from './segmented-control-variants';
import { useLockedArrowFocus } from './use-locked-arrow-focus';

type TSegmentedControlOption<TValue extends string> = {
  value: TValue;
  label: string;
  description?: string;
  glyph?: ReactNode;
};

export type TSegmentedControlProps<TValue extends string> = {
  options: TSegmentedControlOption<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
  aria?: TControlAria;
  isDisabled?: boolean;
  isLocked?: boolean;
  optionWidth?: TSegmentedOptionWidth;
  isSingleRow?: boolean;
  className?: string;
};

export const SegmentedControl = <TValue extends string>({
  options,
  value,
  onChange,
  aria = {},
  isDisabled = false,
  isLocked = false,
  optionWidth = SEGMENTED_OPTION_WIDTH.FIT,
  isSingleRow = false,
  className,
}: TSegmentedControlProps<TValue>) => {
  const descriptionId = useId();
  const { label: ariaLabel, labelledBy, describedBy } = aria;
  const { setOptionRef, onKeyDown } = useLockedArrowFocus(isLocked);
  const hasDescriptions = options.some(({ description }) => description);
  const hasGlyphs = options.some(({ glyph }) => glyph);
  const selectedDescription = options.find(
    ({ value: optionValue }) => optionValue === value,
  )?.description;
  const {
    wrapper,
    root,
    option,
    glyph: glyphSlot,
    selectedDescription: descriptionSlot,
  } = segmentedControlVariants({
    isLocked: isLocked || isDisabled,
    hasGlyphs,
    isSingleRow,
    optionWidth,
  });

  const group = (
    <ToggleGroup
      {...singleSelectToggleGroupProps(value, onChange, { isLocked })}
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-labelledby={labelledBy}
      aria-describedby={joinIds(
        describedBy,
        selectedDescription && descriptionId,
      )}
      onKeyDown={onKeyDown}
      className={root({ class: hasDescriptions ? undefined : className })}
    >
      {options.map(({ value: optionValue, label, glyph }, index) => (
        <Toggle
          key={optionValue}
          ref={setOptionRef(index)}
          value={optionValue}
          aria-disabled={isLocked || undefined}
          className={option()}
        >
          {glyph && (
            <span aria-hidden={true} className={glyphSlot()}>
              {glyph}
            </span>
          )}
          {label}
        </Toggle>
      ))}
    </ToggleGroup>
  );

  if (!hasDescriptions) {
    return group;
  }

  return (
    <div className={wrapper({ class: className })}>
      {group}
      <p id={descriptionId} aria-live="polite" className={descriptionSlot()}>
        {selectedDescription}
      </p>
    </div>
  );
};
