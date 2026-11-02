import { SIZE } from '@blog/config';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { Button } from '@platform/components/shared/button';
import { Card } from '@platform/components/shared/card';
import { PresetPicker } from '@platform/components/shared/preset-picker';
import { UnsavedDot } from '@platform/components/shared/unsaved-dot';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { useSettingsFormState } from '@platform/context/settings-form-provider';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { presetCardVariants } from './preset-card-variants';

export const PresetCard = () => {
  const { isArchived, archivedDescribedBy } = useSettingsFormState();
  const {
    values,
    changePreset,
    resetToPreset,
    isDivergedFromPreset,
    hasCardChanges,
  } = useLookForm();
  const t = useTranslations('lookForm');
  const titleId = useId();
  const { title, body } = presetCardVariants();

  return (
    <Card aria-labelledby={titleId}>
      <Card.Header
        title={
          <span className={title()}>
            <span id={titleId}>{t('presetLabel')}</span>
            {hasCardChanges('preset') && <UnsavedDot />}
          </span>
        }
        supportingText={t('presetDescription')}
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
      />
      <Card.Body className={body()}>
        <PresetPicker
          value={values.preset}
          onChange={changePreset}
          isDisabled={isArchived}
          aria-describedby={archivedDescribedBy}
        />
      </Card.Body>
    </Card>
  );
};
