'use client';

import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import type { TControlAria, TControlLock } from '@blog/config';
import type { IWithClassName } from '@blog/config/types';
import { DecorativeGlyph } from '@platform/components/shared/decorative-glyph';
import {
  SEGMENTED_LAYOUT,
  type TSegmentedLayout,
} from '@platform/constants/segmented-control';
import { singleSelectToggleGroupProps } from '@platform/utils/single-select-toggle-group/single-select-toggle-group';
import type { ReactNode } from 'react';

import { SelectedDescription } from './components/selected-description/selected-description';
import { segmentedControlVariants } from './segmented-control-variants';
import { useLockedArrowFocus } from './use-locked-arrow-focus';
import { useSelectedDescription } from './use-selected-description';

type TSegmentedControlOption<TValue extends string> = {
  value: TValue;
  label: string;
  description?: string;
  glyph?: ReactNode;
};

export type TSegmentedControlProps<TValue extends string> = IWithClassName & {
  options: TSegmentedControlOption<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
  aria?: TControlAria;
  lock?: TControlLock;
  layout?: TSegmentedLayout;
};

export const SegmentedControl = <TValue extends string>({
  options,
  value,
  onChange,
  aria = {},
  lock = {},
  layout = SEGMENTED_LAYOUT.FIT,
  className,
}: TSegmentedControlProps<TValue>) => {
  const { isDisabled = false, isLocked = false } = lock;
  const { label: ariaLabel, labelledBy, describedBy } = aria;
  const { setOptionRef, onKeyDown } = useLockedArrowFocus(isLocked);
  const hasDescriptions = options.some(({ description }) => description);
  const hasGlyphs = options.some(({ glyph }) => glyph);
  const { descriptionId, description, groupDescribedBy } =
    useSelectedDescription(options, value, describedBy);
  const {
    wrapper,
    root,
    option,
    glyph: glyphSlot,
  } = segmentedControlVariants({
    isLocked: isLocked || isDisabled,
    hasGlyphs,
    layout,
  });

  const group = (
    <ToggleGroup
      {...singleSelectToggleGroupProps(value, onChange, { isLocked })}
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-labelledby={labelledBy}
      aria-describedby={groupDescribedBy}
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
          <DecorativeGlyph glyph={glyph} className={glyphSlot()} />
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
      <SelectedDescription id={descriptionId} description={description} />
    </div>
  );
};
