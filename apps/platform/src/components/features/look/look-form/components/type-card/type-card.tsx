import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import { LookField } from '@platform/components/features/look/look-form/components/look-field';
import { toLookLabelOptions } from '@platform/components/features/look/look-form/components/look-option-glyph';
import { LookPresetChoiceField } from '@platform/components/features/look/look-form/components/look-preset-choice-field';
import { PresetValueButton } from '@platform/components/features/look/look-form/components/preset-value-button';
import { useLookFieldLock } from '@platform/components/features/look/look-form/use-look-field-lock';
import { useLookRowLock } from '@platform/components/features/look/look-form/use-look-row-lock';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { FontPicker } from '@platform/components/shared/font-picker';
import { LOOK_ROW } from '@platform/constants/look-row';
import { CARD_FIELDS } from '@platform/utils/look-form-values/look-form-values';
import { HEADING_CASE, HEADING_WEIGHT } from '@shinefold/config';
import { useTranslations } from 'next-intl';

export type TTypeCardProps = {
  summary: string;
};

export const TypeCard = ({ summary }: TTypeCardProps) => {
  const {
    values: { headingFont, bodyFont },
    updateField,
  } = useLookForm();
  const t = useTranslations('lookForm');
  const headingFontLock = useLookFieldLock('headingFont');
  const bodyFontLock = useLookFieldLock('bodyFont');
  const { lockLine, hasGrowthBadge } = useLookRowLock(
    CARD_FIELDS[LOOK_ROW.TYPE],
    'lockLineTypeFonts',
  );

  const headingFontLabel = t('headingFontLabel');
  const bodyFontLabel = t('bodyFontLabel');
  const headingWeightOptions = toLookLabelOptions(HEADING_WEIGHT, (weight) =>
    t(`headingWeightOptionLabel.${weight}`),
  );
  const headingCaseOptions = toLookLabelOptions(HEADING_CASE, (headingCase) =>
    t(`headingCaseOptionLabel.${headingCase}`),
  );

  return (
    <LookCard
      summary={summary}
      card={LOOK_ROW.TYPE}
      description={t('typeDescription')}
      lockLine={lockLine}
      hasGrowthBadge={hasGrowthBadge}
    >
      <LookField
        field="headingFont"
        label={headingFontLabel}
        lock={headingFontLock}
      >
        <FontPicker
          aria={headingFontLock.aria}
          value={headingFont}
          onChange={(font) => updateField('headingFont', font)}
          isLocked={headingFontLock.isLocked}
        />
        <PresetValueButton field="headingFont" fieldLabel={headingFontLabel} />
      </LookField>

      <LookField field="bodyFont" label={bodyFontLabel} lock={bodyFontLock}>
        <FontPicker
          aria={bodyFontLock.aria}
          value={bodyFont}
          onChange={(font) => updateField('bodyFont', font)}
          isLocked={bodyFontLock.isLocked}
        />
        <PresetValueButton field="bodyFont" fieldLabel={bodyFontLabel} />
      </LookField>

      <LookPresetChoiceField
        field="headingWeight"
        label={t('headingWeightLabel')}
        hint={t('headingWeightDescription')}
        options={headingWeightOptions}
      />

      <LookPresetChoiceField
        field="headingCase"
        label={t('headingCaseLabel')}
        hint={t('headingCaseDescription')}
        options={headingCaseOptions}
      />
    </LookCard>
  );
};
