'use client';

import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { type ReactNode, useId } from 'react';

import { checkboxVariants, type TCheckboxVariants } from './checkbox-variants';

export type TCheckboxProps = {
  isChecked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: ReactNode;
  error?: string;
  isDisabled?: boolean;
  size?: TCheckboxVariants['size'];
};

export const Checkbox = ({
  isChecked,
  onCheckedChange,
  label,
  error,
  isDisabled = false,
  size,
}: TCheckboxProps) => {
  const errorId = useId();
  const {
    root,
    label: labelSlot,
    box,
    tick,
    error: errorSlot,
  } = checkboxVariants({ size });

  return (
    <div className={root()}>
      <label className={labelSlot()}>
        <BaseCheckbox.Root
          checked={isChecked}
          onCheckedChange={onCheckedChange}
          disabled={isDisabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={box()}
        >
          <BaseCheckbox.Indicator className={tick()} />
        </BaseCheckbox.Root>
        <span>{label}</span>
      </label>
      {error && (
        <p id={errorId} className={errorSlot()}>
          {error}
        </p>
      )}
    </div>
  );
};
