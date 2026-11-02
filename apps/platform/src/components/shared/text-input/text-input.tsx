'use client';

import { Input } from '@base-ui/react/input';
import { useFormFieldControl } from '@platform/components/shared/form-field';
import { FIELD_APPEARANCE } from '@platform/constants/field-appearance';
import { DISABLED_READONLY_SURFACE_CLASSES } from '@platform/utils/disabled-state-classes/disabled-state-classes';
import {
  FIELD_FOCUS_CLASSES,
  FIELD_SURFACE_CLASSES,
} from '@platform/utils/field-surface-classes/field-surface-classes';
import { INVALID_SURFACE_CLASSES } from '@platform/utils/invalid-state-classes/invalid-state-classes';
import { tv } from '@platform/utils/tv/tv';
import type { Ref } from 'react';
import type { VariantProps } from 'tailwind-variants';

const textInputVariants = tv({
  base: [
    'w-full',
    FIELD_SURFACE_CLASSES,
    FIELD_FOCUS_CLASSES,
    INVALID_SURFACE_CLASSES,
  ],
  variants: {
    appearance: {
      [FIELD_APPEARANCE.DEFAULT]: '',
      [FIELD_APPEARANCE.WIZARD]: 'md:h-10 md:px-3 md:py-0 md:text-admin-14',
    },
    isDisabled: {
      true: `${DISABLED_READONLY_SURFACE_CLASSES} text-admin-muted cursor-not-allowed`,
    },
    isReadOnly: {
      true: `${DISABLED_READONLY_SURFACE_CLASSES} text-admin-muted`,
    },
  },
});

type TTextInputVariants = VariantProps<typeof textInputVariants>;

export type TTextInputProps = {
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  isReadOnly?: TTextInputVariants['isReadOnly'];
  className?: string;
  ref?: Ref<HTMLInputElement>;
};

export const TextInput = ({
  value,
  onChange,
  type,
  placeholder,
  isReadOnly,
  className,
  ref,
}: TTextInputProps) => {
  const { id, describedBy, appearance } = useFormFieldControl();

  return (
    <Input
      ref={ref}
      id={id}
      type={type}
      placeholder={placeholder}
      readOnly={Boolean(isReadOnly)}
      value={value}
      onValueChange={(nextValue) => onChange(nextValue)}
      aria-describedby={describedBy}
      className={({ disabled }) =>
        textInputVariants({
          appearance,
          isDisabled: disabled,
          isReadOnly,
          class: className,
        })
      }
    />
  );
};
