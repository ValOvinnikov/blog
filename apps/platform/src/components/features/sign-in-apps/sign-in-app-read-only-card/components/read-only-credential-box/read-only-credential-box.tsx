'use client';

import { FormField } from '@platform/components/shared/form-field';
import { TextInput } from '@platform/components/shared/text-input';

import { readOnlyCredentialBoxVariants } from './read-only-credential-box-variants';

export type TReadOnlyCredentialBoxProps = {
  label: string;
  value: string;
  isMono?: boolean;
};

export const ReadOnlyCredentialBox = ({
  label,
  value,
  isMono = false,
}: TReadOnlyCredentialBoxProps) => (
  <FormField label={label}>
    <TextInput
      value={value}
      onChange={() => undefined}
      isReadOnly={true}
      className={readOnlyCredentialBoxVariants({ isMono })}
    />
  </FormField>
);
