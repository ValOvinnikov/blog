'use client';

import type { TMaybeUndefined } from '@blog/config';
import { FormField } from '@platform/components/shared/form-field';
import { Text } from '@platform/components/shared/text';
import { TextInput } from '@platform/components/shared/text-input';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { formSiteAddressInputVariants } from './form-site-address-input-variants';

export type TFormSiteAddressInputProps = {
  label: string;
  hint: string;
  error?: string;
  isInvalid?: boolean;
  value: string;
  onChange: (value: string) => void;
  rootDomain: TMaybeUndefined<string>;
};

export const FormSiteAddressInput = ({
  label,
  hint,
  error,
  isInvalid,
  value,
  onChange,
  rootDomain,
}: TFormSiteAddressInputProps) => {
  const t = useTranslations('formSiteAddressInput');
  const suffixId = useId();
  const { row, input, suffix } = formSiteAddressInputVariants();

  return (
    <FormField
      label={label}
      hint={hint}
      error={error}
      isInvalid={isInvalid}
      control={{ describedBy: rootDomain ? suffixId : undefined }}
    >
      <div className={row()}>
        <TextInput
          value={value}
          onChange={(next) => onChange(next.trim().toLowerCase())}
          className={input()}
        />
        {rootDomain && (
          <Text
            as="span"
            id={suffixId}
            variant="supporting"
            className={suffix()}
          >
            {t('suffix', { rootDomain })}
          </Text>
        )}
      </div>
    </FormField>
  );
};
