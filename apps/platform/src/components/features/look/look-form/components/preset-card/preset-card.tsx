import { GrantedBadge } from '@platform/components/features/entitlement-grants/granted-badge';
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
import { SIZE, type TPresetId } from '@shinefold/config';
import { GRANTABLE_PRESET_IDS } from '@shinefold/config/constants';
import { hasArrayGotItems, isOneOf } from '@shinefold/utils/primitives';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { PresetGrantControls } from './components/preset-grant-controls/preset-grant-controls';
import { PresetStrip } from './components/preset-strip';
import { presetCardVariants } from './preset-card-variants';
import { PRESET_SWATCH } from './preset-swatch';

export const PresetCard = () => {
  const { isArchived, archivedDescribedBy } = useSettingsFormState();
  const {
    values,
    presets,
    grants,
    changePreset,
    resetToPreset,
    canResetToPreset,
  } = useLookForm();
  const t = useTranslations('lookForm');
  const tPreset = useTranslations('presetPicker');
  const { target, granted } = grants;
  const grantOf = (id: TPresetId) =>
    isOneOf(GRANTABLE_PRESET_IDS, id) ? granted[id] : undefined;
  const presetOptions = presets.map((id) => {
    const labelKey = PRESET_LABEL_KEY[id];
    const grant = grantOf(id);
    return {
      id,
      name: tPreset(labelKey),
      description: tPreset(`${labelKey}Description`),
      swatch: PRESET_SWATCH[id],
      badge: grant && <GrantedBadge expiresAt={grant.expiresAt} />,
    };
  });
  const grantablePresets = target
    ? GRANTABLE_PRESET_IDS.filter((id) => !presets.includes(id))
    : [];
  const titleId = useId();
  const { body, heading, strip, actions, reset } = presetCardVariants();

  return (
    <Card
      id={toLookAnchorId(LOOK_CARD.PRESET)}
      aria-labelledby={titleId}
      className={LOOK_ANCHOR_CLASSES}
    >
      <Card.Body className={body()}>
        <div className={heading()}>
          <Heading id={titleId} level={2} size="cardTitle" tabIndex={-1}>
            {t('presetLabel')}
          </Heading>
          <Text variant="muted">{t('presetDescription')}</Text>
        </div>
        <div className={strip()}>
          <PresetStrip
            presets={presetOptions}
            value={values.preset}
            onChange={changePreset}
            labelledBy={titleId}
            describedBy={archivedDescribedBy}
            isLocked={isArchived}
          />
        </div>
        {(canResetToPreset || hasArrayGotItems(grantablePresets)) && (
          <div className={actions()}>
            {target && (
              <PresetGrantControls
                target={target}
                presets={grantablePresets}
                returnFocusId={titleId}
              />
            )}
            {canResetToPreset && (
              <Button
                type="button"
                variant={BUTTON_VARIANT.SECONDARY}
                size={SIZE.MD}
                onClick={resetToPreset}
                isAriaDisabled={isArchived}
                aria-describedby={archivedDescribedBy}
                className={reset()}
              >
                {t('resetButton')}
              </Button>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};
