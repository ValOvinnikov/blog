import { useLookPresetName } from '@platform/components/features/look/look-form/use-look-preset-name';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { useTranslations } from 'next-intl';

export const useLookStatusNotes = (hasReaderAccounts: boolean) => {
  const { hasLockedFields } = useLookForm();
  const t = useTranslations('lookPreview');
  const tFollow = useTranslations('lookFollow');
  const presetName = useLookPresetName();

  return {
    readerNote: hasReaderAccounts ? undefined : t('readerAccountsOff'),
    planNote: hasLockedFields
      ? tFollow('freeSample', { preset: presetName })
      : undefined,
  };
};
