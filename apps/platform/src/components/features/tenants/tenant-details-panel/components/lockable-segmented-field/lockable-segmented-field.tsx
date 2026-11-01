'use client';

import type { TMaybeUndefined } from '@blog/config';
import { FormField } from '@platform/components/shared/form-field';
import {
  SegmentedControl,
  type TSegmentedControlProps,
} from '@platform/components/shared/segmented-control';
import { useId } from 'react';

import { lockableSegmentedFieldVariants } from './lockable-segmented-field-variants';

type TLockableSegmentedFieldProps<TValue extends string> = Pick<
  TSegmentedControlProps<TValue>,
  'options' | 'value' | 'onChange'
> & {
  label: string;
  lockReason: TMaybeUndefined<string>;
};

export const LockableSegmentedField = <TValue extends string>({
  label,
  options,
  value,
  onChange,
  lockReason,
}: TLockableSegmentedFieldProps<TValue>) => {
  const lockReasonId = useId();
  const { control } = lockableSegmentedFieldVariants();

  return (
    <FormField
      label={label}
      control={{ hasOwnAccessibleName: true }}
      hint={lockReason && <span id={lockReasonId}>{lockReason}</span>}
    >
      <SegmentedControl<TValue>
        aria={{
          label: label,
          describedBy: lockReason ? lockReasonId : undefined,
        }}
        options={options}
        value={value}
        onChange={onChange}
        className={control()}
        isDisabled={Boolean(lockReason)}
      />
    </FormField>
  );
};
