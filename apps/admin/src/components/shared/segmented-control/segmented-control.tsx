'use client';

import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';

import { segmentedControlVariants } from './segmented-control-variants';

type TSegmentedControlOption<TValue extends string> = {
  value: TValue;
  label: string;
};

export type TSegmentedControlProps<TValue extends string> = {
  options: TSegmentedControlOption<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
  ariaLabel: string;
  isDisabled?: boolean;
  className?: string;
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
}: TSegmentedControlProps<TValue>) => {
  const { root, option } = segmentedControlVariants();

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
      className={root({ class: className })}
    >
      {options.map((opt) => (
        <Toggle key={opt.value} value={opt.value} className={option()}>
          {opt.label}
        </Toggle>
      ))}
    </ToggleGroup>
  );
};
