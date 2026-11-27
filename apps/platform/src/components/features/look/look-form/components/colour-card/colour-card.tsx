import { logoHueFieldVariants } from '@platform/components/features/look/logo-hue-field/logo-hue-field-variants';
import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import { LookChoiceField } from '@platform/components/features/look/look-form/components/look-choice-field';
import { LookField } from '@platform/components/features/look/look-form/components/look-field';
import { toLookGlyphOptions } from '@platform/components/features/look/look-form/components/look-option-glyph';
import { PresetValueButton } from '@platform/components/features/look/look-form/components/preset-value-button';
import { useLookRowLock } from '@platform/components/features/look/look-form/use-look-row-lock';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { AccentSwatch } from '@platform/components/shared/accent-swatch';
import { HueSlider } from '@platform/components/shared/hue-slider';
import { LOOK_ROW } from '@platform/constants/look-row';
import { useSettingsFormState } from '@platform/context/settings-form-provider';
import { CARD_FIELDS } from '@platform/utils/look-form-values/look-form-values';
import { COLOR_MODE, SIZE } from '@shinefold/config';
import { LOOK_FIELD } from '@shinefold/db/constants';
import { useTranslations } from 'next-intl';

import { ButtonColorFields } from './components/button-color-fields/button-color-fields';

export type TColourCardProps = {
  summary: string;
};

export const ColourCard = ({ summary }: TColourCardProps) => {
  const { isArchived, archivedDescribedBy } = useSettingsFormState();
  const {
    values: { accentHue },
    updateField,
    accentHueFieldId,
    isAccentHueRejected,
  } = useLookForm();
  const t = useTranslations('lookForm');
  const tHue = useTranslations('logoHueField');
  const { lockLine, hasGrowthBadge } = useLookRowLock(
    CARD_FIELDS[LOOK_ROW.COLOUR],
  );
  const { hueField, hueValue } = logoHueFieldVariants();

  const accentHueLabel = t('accentHueLabel');
  const colorModeOptions = toLookGlyphOptions('colorMode', COLOR_MODE, (mode) =>
    t(`colorModeOptionLabel.${mode}`),
  );

  return (
    <LookCard
      summary={summary}
      summaryMark={<AccentSwatch hue={accentHue} size={SIZE.XS} />}
      card={LOOK_ROW.COLOUR}
      description={t('colourDescription')}
      lockLine={lockLine}
      hasGrowthBadge={hasGrowthBadge}
    >
      <LookField
        field="accentHue"
        label={accentHueLabel}
        hint={t('accentHueDescription')}
        error={isAccentHueRejected ? t('accentHueInaccessible') : undefined}
      >
        <div className={hueField()}>
          <AccentSwatch hue={accentHue} size={SIZE.LG} />
          <HueSlider
            id={accentHueFieldId}
            name={{ ariaLabel: accentHueLabel }}
            value={accentHue}
            onChange={(value) => updateField('accentHue', value)}
            isLocked={isArchived}
            aria-describedby={archivedDescribedBy}
          />
          <span className={hueValue()}>
            {tHue('hueValue', { hue: accentHue })}
          </span>
        </div>
        <PresetValueButton field="accentHue" fieldLabel={accentHueLabel} />
      </LookField>

      <ButtonColorFields />

      <LookChoiceField
        field={LOOK_FIELD.COLOR_MODE}
        label={t('colorModeLabel')}
        hint={t('colorModeDescription')}
        options={colorModeOptions}
      />
    </LookCard>
  );
};
