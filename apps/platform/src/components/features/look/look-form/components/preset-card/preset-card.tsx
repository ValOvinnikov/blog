import { SIZE } from '@blog/config';
import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { Button } from '@platform/components/shared/button';
import { PresetPicker } from '@platform/components/shared/preset-picker';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { useSettingsFormState } from '@platform/context/settings-form-provider';
import { useTranslations } from 'next-intl';

export const PresetCard = () => {
  const { isArchived, archivedDescribedBy } = useSettingsFormState();
  const { values, changePreset, resetToPreset, isDivergedFromPreset } =
    useLookForm();
  const t = useTranslations('lookForm');

  return (
    <LookCard
      card="preset"
      title={t('presetLabel')}
      description={t('presetDescription')}
      actions={
        isDivergedFromPreset && (
          <Button
            type="button"
            variant={BUTTON_VARIANT.SECONDARY}
            size={SIZE.SM}
            focusGround={FOCUS_RING_GROUND.SURFACE_HEAD}
            onClick={resetToPreset}
            isDisabled={isArchived}
            aria-describedby={archivedDescribedBy}
          >
            {t('resetButton')}
          </Button>
        )
      }
    >
      <PresetPicker
        value={values.preset}
        onChange={changePreset}
        isDisabled={isArchived}
        aria-describedby={archivedDescribedBy}
      />
    </LookCard>
  );
};
