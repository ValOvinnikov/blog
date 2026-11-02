'use client';

import { Menu } from '@base-ui/react/menu';
import {
  Icon,
  type TRegisteredIconName,
} from '@platform/components/shared/icon';
import { ICON_SIZE } from '@platform/constants/icon';
import {
  MENU_RADIO_GROUP_SIZE,
  type TMenuRadioGroupSize,
} from '@platform/constants/menu-radio-group';
import { useId } from 'react';

import { menuRadioGroupVariants } from './menu-radio-group-variants';

type TMenuRadioGroupOption<TValue extends string> = {
  value: TValue;
  label: string;
  icon: TRegisteredIconName;
};

export type TMenuRadioGroupProps<TValue extends string> = {
  label: string;
  hint?: string;
  options: TMenuRadioGroupOption<TValue>[];
  value: TValue;
  onValueChange: (value: TValue) => void;
  size?: TMenuRadioGroupSize;
  className?: string;
};

export const MenuRadioGroup = <TValue extends string>({
  label,
  hint,
  options,
  value,
  onValueChange,
  size = MENU_RADIO_GROUP_SIZE.DESKTOP,
  className,
}: TMenuRadioGroupProps<TValue>) => {
  const hintId = useId();
  const {
    root,
    label: labelSlot,
    track,
    item,
    hint: hintSlot,
  } = menuRadioGroupVariants({ size });

  return (
    <Menu.RadioGroup
      value={value}
      onValueChange={(nextValue: TValue) => onValueChange(nextValue)}
      aria-describedby={hint ? hintId : undefined}
      className={root({ class: className })}
    >
      <Menu.GroupLabel className={labelSlot()}>{label}</Menu.GroupLabel>
      <div className={track()}>
        {options.map(({ value: optionValue, label: optionLabel, icon }) => (
          <Menu.RadioItem
            key={optionValue}
            value={optionValue}
            label={optionLabel}
            className={item()}
          >
            <Icon name={icon} size={ICON_SIZE.XS} />
            {optionLabel}
          </Menu.RadioItem>
        ))}
      </div>
      {hint ? (
        <p id={hintId} className={hintSlot()}>
          {hint}
        </p>
      ) : null}
    </Menu.RadioGroup>
  );
};
