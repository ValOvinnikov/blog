import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { PRESET_LABEL_KEY } from '@platform/components/shared/preset-picker';
import { useTranslations } from 'next-intl';

export const useLookPresetName = (): string => {
  const {
    values: { preset },
  } = useLookForm();
  const t = useTranslations('presetPicker');

  return t(PRESET_LABEL_KEY[preset]);
};
