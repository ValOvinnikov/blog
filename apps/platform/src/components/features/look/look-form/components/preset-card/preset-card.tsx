import { PRESET_ID, SIZE } from '@blog/config';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { Button } from '@platform/components/shared/button';
import { Card } from '@platform/components/shared/card';
import { Heading } from '@platform/components/shared/heading';
import { PRESET_LABEL_KEY } from '@platform/components/shared/preset-picker';
import { Text } from '@platform/components/shared/text';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { LOOK_CARD } from '@platform/constants/look-card';
import { useSettingsFormState } from '@platform/context/settings-form-provider';
import {
  LOOK_ANCHOR_CLASSES,
  toLookAnchorId,
} from '@platform/utils/look-anchor/look-anchor';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { PresetStrip } from './components/preset-strip';
import { presetCardVariants } from './preset-card-variants';
import { PRESET_SWATCH } from './preset-swatch';

export const PresetCard = () => {
  const { isArchived, archivedDescribedBy } = useSettingsFormState();
  const { values, changePreset, resetToPreset, canResetToPreset } =
    useLookForm();
  const t = useTranslations('lookForm');
  const tPreset = useTranslations('presetPicker');
  const presets = Object.values(PRESET_ID).map((id) => {
    const labelKey = PRESET_LABEL_KEY[id];
    return {
      id,
      name: tPreset(labelKey),
      description: tPreset(`${labelKey}Description`),
      swatch: PRESET_SWATCH[id],
    };
  });
  const titleId = useId();
  const { body, heading, strip, reset } = presetCardVariants();

  return (
    <Card
      id={toLookAnchorId(LOOK_CARD.PRESET)}
      aria-labelledby={titleId}
      className={LOOK_ANCHOR_CLASSES}
    >
      <Card.Body className={body()}>
        <div className={heading()}>
          <Heading id={titleId} level={2} size="cardTitle">
            {t('presetLabel')}
          </Heading>
          <Text variant="muted">{t('presetDescription')}</Text>
        </div>
        <div className={strip()}>
          <PresetStrip
            presets={presets}
            value={values.preset}
            onChange={changePreset}
            labelledBy={titleId}
            describedBy={archivedDescribedBy}
            isDisabled={isArchived}
          />
        </div>
        {canResetToPreset && (
          <Button
            type="button"
            variant={BUTTON_VARIANT.SECONDARY}
            size={SIZE.MD}
            onClick={resetToPreset}
            isDisabled={isArchived}
            aria-describedby={archivedDescribedBy}
            className={reset()}
          >
            {t('resetButton')}
          </Button>
        )}
      </Card.Body>
    </Card>
  );
};
