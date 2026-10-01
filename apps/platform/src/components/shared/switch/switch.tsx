'use client';

import { Switch as BaseSwitch } from '@base-ui/react/switch';
import type { AriaAttributes } from 'react';

import { switchVariants } from './switch-variants';

export type TSwitchProps = {
  isChecked: boolean;
  onCheckedChange: (checked: boolean) => void;
  ariaLabel: string;
  onLabel: string;
  offLabel: string;
  isDisabled?: boolean;
  'aria-describedby'?: AriaAttributes['aria-describedby'];
};

export const Switch = ({
  isChecked,
  onCheckedChange,
  ariaLabel,
  onLabel,
  offLabel,
  isDisabled = false,
  'aria-describedby': ariaDescribedBy,
}: TSwitchProps) => {
  const { track, thumb, label } = switchVariants();

  return (
    <>
      <BaseSwitch.Root
        checked={isChecked}
        onCheckedChange={onCheckedChange}
        disabled={isDisabled}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        className={track()}
      >
        <BaseSwitch.Thumb className={thumb()} />
      </BaseSwitch.Root>
      <span className={label()}>{isChecked ? onLabel : offLabel}</span>
    </>
  );
};
