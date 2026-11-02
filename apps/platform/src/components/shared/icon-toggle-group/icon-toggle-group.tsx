'use client';

import { ToggleGroup } from '@base-ui/react/toggle-group';
import { singleSelectToggleGroupProps } from '@platform/utils/single-select-toggle-group/single-select-toggle-group';
import { tv } from '@platform/utils/tv/tv';

import {
  IconToggleGroupOption,
  type TIconToggleGroupOption,
} from './components/option/icon-toggle-group-option';

const iconToggleGroupVariants = tv({
  base: [
    'inline-flex flex-none gap-0.5 p-0.5',
    'rounded-admin-5 border border-admin-control-line bg-admin-theme-track',
  ],
});

export type TIconToggleGroupProps<TValue extends string> = {
  ariaLabel: string;
  options: TIconToggleGroupOption<TValue>[];
  value: TValue;
  onChange(value: TValue): void;
  className?: string;
};

export const IconToggleGroup = <TValue extends string>({
  ariaLabel,
  options,
  value,
  onChange,
  className,
}: TIconToggleGroupProps<TValue>) => (
  <ToggleGroup
    {...singleSelectToggleGroupProps(value, onChange)}
    loopFocus={false}
    aria-label={ariaLabel}
    className={iconToggleGroupVariants({ class: className })}
  >
    {options.map((option) => (
      <IconToggleGroupOption
        key={option.value}
        option={option}
        groupLabel={ariaLabel}
      />
    ))}
  </ToggleGroup>
);
