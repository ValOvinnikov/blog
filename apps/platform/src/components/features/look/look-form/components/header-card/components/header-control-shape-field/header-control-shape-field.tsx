import { HEADER_CONTROL_SHAPE } from '@blog/config';
import { LookOptionGlyph } from '@platform/components/features/look/look-form/components/look-option-glyph';
import { LookPresetChoiceField } from '@platform/components/features/look/look-form/components/look-preset-choice-field';
import { SEGMENTED_LAYOUT } from '@platform/constants/segmented-control';
import { useTranslations } from 'next-intl';

export const HeaderControlShapeField = () => {
  const t = useTranslations('lookForm');

  const options = Object.values(HEADER_CONTROL_SHAPE).map((shape) => ({
    value: shape,
    label: t(`headerControlShapeOptionLabel.${shape}`),
    description: t(`headerControlShapeOptionDescription.${shape}`),
    glyph: <LookOptionGlyph field="headerControlShape" value={shape} />,
  }));

  return (
    <LookPresetChoiceField
      field="headerControlShape"
      label={t('headerControlShapeLabel')}
      hint={t('headerControlShapeDescription')}
      options={options}
      layout={SEGMENTED_LAYOUT.WIDE}
    />
  );
};
