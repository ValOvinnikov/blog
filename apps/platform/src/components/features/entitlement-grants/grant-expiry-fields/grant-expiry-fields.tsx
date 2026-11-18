'use client';

import { FormField } from '@platform/components/shared/form-field';
import { OptionSelect } from '@platform/components/shared/option-select';
import { Textarea } from '@platform/components/shared/textarea';
import {
  ENTITLEMENT_GRANT_EXPIRY,
  type TEntitlementGrantExpiry,
} from '@platform/constants/entitlement-grant';
import { tv } from '@platform/utils/tv/tv';
import { useTranslations } from 'next-intl';

const grantExpiryFieldsVariants = tv({
  slots: {
    root: ['flex flex-col gap-4'],
  },
});

const EXPIRIES = Object.values(ENTITLEMENT_GRANT_EXPIRY);

export type TGrantExpiryFieldsProps = {
  expiry: TEntitlementGrantExpiry;
  onExpiryChange: (expiry: TEntitlementGrantExpiry) => void;
  note: string;
  onNoteChange: (note: string) => void;
};

export const GrantExpiryFields = ({
  expiry,
  onExpiryChange,
  note,
  onNoteChange,
}: TGrantExpiryFieldsProps) => {
  const t = useTranslations('grantExpiryFields');
  const { root } = grantExpiryFieldsVariants();

  return (
    <div className={root()}>
      <FormField label={t('expiresLabel')} hint={t('expiresHint')}>
        <OptionSelect
          options={EXPIRIES.map((value) => ({
            value,
            label: t(`expiry.${value}`),
          }))}
          value={expiry}
          onChange={onExpiryChange}
          aria={{ label: t('expiresLabel') }}
        />
      </FormField>
      <FormField label={t('noteLabel')} hint={t('noteHint')}>
        <Textarea value={note} onChange={onNoteChange} rows={3} />
      </FormField>
    </div>
  );
};
