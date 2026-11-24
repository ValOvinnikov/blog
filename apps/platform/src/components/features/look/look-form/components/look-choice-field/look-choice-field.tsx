import { LookField } from '@platform/components/features/look/look-form/components/look-field';
import { useLookFieldLock } from '@platform/components/features/look/look-form/use-look-field-lock';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import {
  SegmentedControl,
  type TSegmentedControlProps,
} from '@platform/components/shared/segmented-control';
import type { TSegmentedLayout } from '@platform/constants/segmented-control';
import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import type { IWithChildren } from '@shinefold/config/react';

export type TLookChoiceFieldKey = {
  [TKey in keyof TLookFormValues]: TLookFormValues[TKey] extends string
    ? TKey
    : never;
}[keyof TLookFormValues];

export type TLookChoiceFieldProps<TField extends TLookChoiceFieldKey> =
  Partial<IWithChildren> & {
    field: TField;
    label: string;
    hint?: string;
    options: TSegmentedControlProps<TLookFormValues[TField]>['options'];
    layout?: TSegmentedLayout;
  };

export const LookChoiceField = <TField extends TLookChoiceFieldKey>({
  field,
  label,
  hint,
  options,
  layout,
  children,
}: TLookChoiceFieldProps<TField>) => {
  const { values, updateField } = useLookForm();
  const lock = useLookFieldLock(field);

  return (
    <LookField
      field={field}
      label={label}
      hint={hint}
      isGroup={true}
      lock={lock}
    >
      <SegmentedControl<TLookFormValues[TField]>
        aria={lock.aria}
        options={options}
        value={values[field]}
        onChange={(value) => updateField(field, value)}
        lock={lock}
        layout={layout}
      />
      {children}
    </LookField>
  );
};
