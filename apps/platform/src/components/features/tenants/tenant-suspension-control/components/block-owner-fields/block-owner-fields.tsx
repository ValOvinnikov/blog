'use client';

import { FormField } from '@platform/components/shared/form-field';
import { SettingRow } from '@platform/components/shared/setting-row';
import { Switch } from '@platform/components/shared/switch';
import { TextInput } from '@platform/components/shared/text-input';
import { tv } from '@platform/utils/tv/tv';
import { useTranslations } from 'next-intl';

const blockOwnerFieldsVariants = tv({
  slots: {
    root: ['flex flex-col gap-4'],
  },
});

export type TBlockOwnerFieldsProps = {
  isBlocking: boolean;
  onBlockingChange: (isBlocking: boolean) => void;
  reason: string;
  onReasonChange: (reason: string) => void;
};

export const BlockOwnerFields = ({
  isBlocking,
  onBlockingChange,
  reason,
  onReasonChange,
}: TBlockOwnerFieldsProps) => {
  const t = useTranslations('tenantSuspensionControl.blockOwner');
  const { root } = blockOwnerFieldsVariants();

  return (
    <div className={root()}>
      <SettingRow label={t('switchLabel')} description={t('description')}>
        <Switch
          aria={{ label: t('switchLabel') }}
          isChecked={isBlocking}
          onCheckedChange={onBlockingChange}
          labels={{ on: t('switchOn'), off: t('switchOff') }}
        />
      </SettingRow>

      {isBlocking && (
        <FormField label={t('reasonLabel')} hint={t('reasonHint')}>
          <TextInput value={reason} onChange={onReasonChange} />
        </FormField>
      )}
    </div>
  );
};
