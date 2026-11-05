'use client';

import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import type { TControlAria } from '@blog/config';
import { singleSelectToggleGroupProps } from '@platform/utils/single-select-toggle-group/single-select-toggle-group';
import { useId } from 'react';

import {
  OptionBody,
  optionBodyIds,
} from './components/option-body/option-body';
import { segmentedControlVariants } from './segmented-control-variants';
import { useLockedArrowFocus } from './use-locked-arrow-focus';

type TSegmentedControlOption<TValue extends string> = {
  value: TValue;
  label: string;
  description?: string;
};

export type TSegmentedControlProps<TValue extends string> = {
  options: TSegmentedControlOption<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
  aria?: TControlAria;
  isDisabled?: boolean;
  isLocked?: boolean;
  className?: string;
};

export const SegmentedControl = <TValue extends string>({
  options,
  value,
  onChange,
  aria = {},
  isDisabled = false,
  isLocked = false,
  className,
}: TSegmentedControlProps<TValue>) => {
  const idPrefix = useId();
  const { label: ariaLabel, labelledBy, describedBy } = aria;
  const { setOptionRef, onKeyDown } = useLockedArrowFocus(isLocked);
  const hasDescriptions = options.some(({ description }) => description);
  const {
    root,
    option,
    optionLabel,
    optionDescription: optionDescriptionSlot,
  } = segmentedControlVariants({
    hasDescriptions,
    isLocked: isLocked || isDisabled,
  });

  return (
    <ToggleGroup
      {...singleSelectToggleGroupProps(value, onChange, { isLocked })}
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onKeyDown={onKeyDown}
      className={root({ class: className })}
    >
      {options.map(({ value: optionValue, label, description }, index) => {
        const ids = optionBodyIds(idPrefix, optionValue);

        return (
          <Toggle
            key={optionValue}
            ref={setOptionRef(index)}
            value={optionValue}
            aria-labelledby={description ? ids.labelId : undefined}
            aria-describedby={description ? ids.descriptionId : undefined}
            aria-disabled={isLocked || undefined}
            className={option()}
          >
            {description ? (
              <OptionBody
                ids={ids}
                label={label}
                description={description}
                labelClassName={optionLabel()}
                descriptionClassName={optionDescriptionSlot()}
              />
            ) : (
              label
            )}
          </Toggle>
        );
      })}
    </ToggleGroup>
  );
};
