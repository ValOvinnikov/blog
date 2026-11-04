import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { Button } from '@platform/components/shared/button';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { useSettingsFormState } from '@platform/context/settings-form-provider';
import type { TPresetSeededField } from '@platform/utils/look-preset/look-preset';
import { useTranslations } from 'next-intl';

import { presetValueButtonVariants } from './preset-value-button-variants';

export type TPresetValueButtonProps = {
  field: TPresetSeededField;
  fieldLabel: string;
};

export const PresetValueButton = ({
  field,
  fieldLabel,
}: TPresetValueButtonProps) => {
  const { isArchived, archivedDescribedBy } = useSettingsFormState();
  const { isPresetValue, isLocked, resetFieldToPreset } = useLookForm();
  const t = useTranslations('lookForm');
  const { root } = presetValueButtonVariants();

  if (isPresetValue(field) || isLocked(field)) {
    return null;
  }

  return (
    <Button
      variant={BUTTON_VARIANT.LINK}
      className={root()}
      onClick={() => resetFieldToPreset(field)}
      isDisabled={isArchived}
      aria-describedby={archivedDescribedBy}
      aria-label={t('usePresetValueAriaLabel', { field: fieldLabel })}
    >
      {t('usePresetValueButton')}
    </Button>
  );
};
