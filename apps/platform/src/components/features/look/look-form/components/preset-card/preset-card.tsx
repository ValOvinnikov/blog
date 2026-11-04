import { SIZE } from '@blog/config';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { Button } from '@platform/components/shared/button';
import { Card } from '@platform/components/shared/card';
import { Heading } from '@platform/components/shared/heading';
import { Text } from '@platform/components/shared/text';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { useSettingsFormState } from '@platform/context/settings-form-provider';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { PresetStrip } from './components/preset-strip';
import { presetCardVariants } from './preset-card-variants';

export const PresetCard = () => {
  const { isArchived, archivedDescribedBy } = useSettingsFormState();
  const { values, changePreset, resetToPreset, canResetToPreset } =
    useLookForm();
  const t = useTranslations('lookForm');
  const titleId = useId();
  const { body, heading, strip, reset } = presetCardVariants();

  return (
    <Card aria-labelledby={titleId}>
      <Card.Body className={body()}>
        <div className={heading()}>
          <Heading id={titleId} level={2} size="cardTitle">
            {t('presetLabel')}
          </Heading>
          <Text variant="muted">{t('presetDescription')}</Text>
        </div>
        <div className={strip()}>
          <PresetStrip
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
