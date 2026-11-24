'use client';

import { FormField } from '@platform/components/shared/form-field';
import { Text } from '@platform/components/shared/text';
import { TextInput } from '@platform/components/shared/text-input';
import {
  FIELD_APPEARANCE,
  type TFieldAppearance,
} from '@platform/constants/field-appearance';
import { tv } from '@platform/utils/tv/tv';
import type { TMaybeUndefined } from '@shinefold/config';
import { useTranslations } from 'next-intl';
import { useId, type ReactNode } from 'react';

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
        input: ['font-platform-mono font-medium'],
        suffix: ['font-platform-mono text-platform-14 font-medium'],
      },
    },
  },
  defaultVariants: {
    appearance: FIELD_APPEARANCE.DEFAULT,
  },
});

type TFormSiteAddressInputCopy = {
  label: string;
  hint: string;
  error?: string;
};

export type TFormSiteAddressInputProps = {
  copy: TFormSiteAddressInputCopy;
  value: string;
  onChange: (value: string) => void;
  rootDomain: TMaybeUndefined<string>;
  appearance?: TFieldAppearance;
  status?: ReactNode;
};

export const FormSiteAddressInput = ({
  copy: { label, hint, error },
  value,
  onChange,
  rootDomain,
  appearance,
  status,
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
      {status}
    </FormField>
  );
};
