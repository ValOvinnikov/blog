'use client';

import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import type { TControlAria } from '@blog/config';
import { useId } from 'react';

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

/** Built on Base UI's Toggle Group, so clicking the selected option would deselect it; that is swallowed, as there is no "none selected" state. */
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
  } = segmentedControlVariants({ hasDescriptions, isLocked });

  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(nextValues) => {
        const nextValue = nextValues[0];
        if (!isLocked && nextValue !== undefined) {
          onChange(nextValue);
        }
      }}
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onKeyDown={onKeyDown}
      className={root({ class: className })}
    >
      {options.map(({ value: optionValue, label, description }, index) => {
        const labelId = `${idPrefix}-${optionValue}-label`;
        const descriptionId = `${idPrefix}-${optionValue}-description`;

        return (
          <Toggle
            key={optionValue}
            ref={setOptionRef(index)}
            value={optionValue}
            aria-labelledby={description ? labelId : undefined}
            aria-describedby={description ? descriptionId : undefined}
            aria-disabled={isLocked || undefined}
            className={option()}
          >
            {description ? (
              <>
                <span id={labelId} className={optionLabel()}>
                  {label}
                </span>
                <span id={descriptionId} className={optionDescriptionSlot()}>
                  {description}
                </span>
              </>
            ) : (
              label
            )}
          </Toggle>
        );
      })}
    </ToggleGroup>
  );
};
