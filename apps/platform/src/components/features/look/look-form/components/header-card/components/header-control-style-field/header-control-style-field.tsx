import { HEADER_CONTROL_STYLE } from '@blog/config';
import { toLookGlyphOptions } from '@platform/components/features/look/look-form/components/look-option-glyph';
import { LookPresetChoiceField } from '@platform/components/features/look/look-form/components/look-preset-choice-field';
import { SEGMENTED_LAYOUT } from '@platform/constants/segmented-control';
import { useTranslations } from 'next-intl';

export const HeaderControlStyleField = () => {
  const t = useTranslations('lookForm');

  const options = toLookGlyphOptions(
    'headerControlStyle',
    HEADER_CONTROL_STYLE,
    (style) => t(`headerControlStyleOptionLabel.${style}`),
    (style) => t(`headerControlStyleOptionDescription.${style}`),
  );

  return (
    <LookPresetChoiceField
      field="headerControlStyle"
      label={t('headerControlStyleLabel')}
      hint={t('headerControlStyleDescription')}
      options={options}
      layout={SEGMENTED_LAYOUT.WIDE}
    />
  );
};
