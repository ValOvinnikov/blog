'use client';

import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { useId, type AriaAttributes } from 'react';

import { segmentedControlVariants } from './segmented-control-variants';

type TSegmentedControlOption<TValue extends string> = {
  value: TValue;
  label: string;
  description?: string;
};

export type TSegmentedControlProps<TValue extends string> = {
  options: TSegmentedControlOption<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
  ariaLabel?: string;
  isDisabled?: boolean;
  className?: string;
  'aria-describedby'?: AriaAttributes['aria-describedby'];
};

/**
 * A small either/or choice (plan, density, visibility) rendered as a single
 * always-one-selected group. Built on Base UI's Toggle Group rather than a
 * radiogroup pattern, so clicking the already-selected option would normally
 * toggle it off — that case is swallowed here rather than surfaced, since a
 * segmented control has no "none selected" state.
 */
export const SegmentedControl = <TValue extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  isDisabled = false,
  className,
  'aria-describedby': ariaDescribedBy,
}: TSegmentedControlProps<TValue>) => {
  const idPrefix = useId();
  const hasDescriptions = options.some(({ description }) => description);
  const {
    root,
    option,
    optionLabel,
    optionDescription: optionDescriptionSlot,
  } = segmentedControlVariants({ hasDescriptions });

  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(nextValues) => {
        const nextValue = nextValues[0];
        if (nextValue !== undefined) {
          onChange(nextValue);
        }
      }}
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      className={root({ class: className })}
    >
      {options.map(({ value: optionValue, label, description }) => {
        const labelId = `${idPrefix}-${optionValue}-label`;
        const descriptionId = `${idPrefix}-${optionValue}-description`;

        return (
          <Toggle
            key={optionValue}
            value={optionValue}
            aria-labelledby={description ? labelId : undefined}
            aria-describedby={description ? descriptionId : undefined}
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
