'use client';

import type { TMaybeUndefined } from '@blog/config';
import { FormField } from '@platform/components/shared/form-field';
import { Text } from '@platform/components/shared/text';
import { TextInput } from '@platform/components/shared/text-input';
import {
  FIELD_APPEARANCE,
  type TFieldAppearance,
} from '@platform/constants/field-appearance';
import { tv } from '@platform/utils/tv/tv';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

const formSiteAddressInputVariants = tv({
  slots: {
    row: ['flex items-center gap-2'],
    input: ['min-w-0 flex-1'],
    suffix: ['shrink-0'],
  },
  variants: {
    appearance: {
      [FIELD_APPEARANCE.DEFAULT]: {},
      [FIELD_APPEARANCE.WIZARD]: {
        suffix: ['text-admin-14'],
      },
    },
  },
  defaultVariants: {
    appearance: FIELD_APPEARANCE.DEFAULT,
  },
});

export type TFormSiteAddressInputProps = {
  label: string;
  hint: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  rootDomain: TMaybeUndefined<string>;
  appearance?: TFieldAppearance;
};

export const FormSiteAddressInput = ({
  label,
  hint,
  error,
  value,
  onChange,
  rootDomain,
  appearance,
}: TFormSiteAddressInputProps) => {
  const t = useTranslations('formSiteAddressInput');
  const suffixId = useId();
  const { row, input, suffix } = formSiteAddressInputVariants({ appearance });

  return (
    <FormField
      label={label}
      hint={hint}
      error={error}
      control={{
        describedBy: rootDomain ? suffixId : undefined,
        appearance,
      }}
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
