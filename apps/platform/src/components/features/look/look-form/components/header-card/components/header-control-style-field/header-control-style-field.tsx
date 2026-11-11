import { HEADER_CONTROL_STYLE } from '@blog/config';
import { LookChoiceField } from '@platform/components/features/look/look-form/components/look-choice-field';
import { LookOptionGlyph } from '@platform/components/features/look/look-form/components/look-option-glyph';
import { SEGMENTED_LAYOUT } from '@platform/constants/segmented-control';
import { useTranslations } from 'next-intl';

export const HeaderControlStyleField = () => {
  const t = useTranslations('lookForm');

  const options = Object.values(HEADER_CONTROL_STYLE).map((style) => ({
    value: style,
    label: t(`headerControlStyleOptionLabel.${style}`),
    description: t(`headerControlStyleOptionDescription.${style}`),
    glyph: <LookOptionGlyph field="headerControlStyle" value={style} />,
  }));

  return (
    <LookChoiceField
      field="headerControlStyle"
      label={t('headerControlStyleLabel')}
      hint={t('headerControlStyleDescription')}
      options={options}
      layout={SEGMENTED_LAYOUT.WIDE}
    />
  );
};
