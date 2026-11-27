import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import { toLookGlyphOptions } from '@platform/components/features/look/look-form/components/look-option-glyph';
import { LookPresetChoiceField } from '@platform/components/features/look/look-form/components/look-preset-choice-field';
import { useLookRowLock } from '@platform/components/features/look/look-form/use-look-row-lock';
import { LOOK_ROW } from '@platform/constants/look-row';
import { SEGMENTED_LAYOUT } from '@platform/constants/segmented-control';
import { CARD_FIELDS } from '@platform/utils/look-form-values/look-form-values';
import {
  BUTTON_SHAPE,
  DENSITY,
  DIVIDER_WIDTH,
  IMAGE_PROPORTION,
  RADIUS_SCALE,
} from '@shinefold/config';
import { useTranslations } from 'next-intl';

import { CardStyleField } from './components/card-style-field/card-style-field';

export type TShapeCardProps = {
  summary: string;
};

export const ShapeCard = ({ summary }: TShapeCardProps) => {
  const t = useTranslations('lookForm');
  const { lockLine, hasGrowthBadge } = useLookRowLock(
    CARD_FIELDS[LOOK_ROW.SHAPE],
  );

  const radiusOptions = toLookGlyphOptions(
    'radiusScale',
    RADIUS_SCALE,
    (scale) => t(`radiusScaleOptionLabel.${scale}`),
  );
  const shapeOptions = toLookGlyphOptions(
    'buttonShape',
    BUTTON_SHAPE,
    (shape) => t(`buttonShapeOptionLabel.${shape}`),
  );
  const densityOptions = toLookGlyphOptions('density', DENSITY, (option) =>
    t(`densityOptionLabel.${option}`),
  );
  const imageProportionOptions = toLookGlyphOptions(
    'imageProportion',
    IMAGE_PROPORTION,
    (proportion) => t(`imageProportionOptionLabel.${proportion}`),
  );
  const dividerWidthOptions = toLookGlyphOptions(
    'dividerWidth',
    DIVIDER_WIDTH,
    (width) => t(`dividerWidthOptionLabel.${width}`),
  );

  return (
    <LookCard
      summary={summary}
      card={LOOK_ROW.SHAPE}
      description={t('shapeDescription')}
      lockLine={lockLine}
      hasGrowthBadge={hasGrowthBadge}
    >
      <LookPresetChoiceField
        field="radiusScale"
        label={t('radiusScaleLabel')}
        hint={t('radiusScaleDescription')}
        options={radiusOptions}
      />
      <LookPresetChoiceField
        field="buttonShape"
        label={t('buttonShapeLabel')}
        hint={t('buttonShapeDescription')}
        options={shapeOptions}
        layout={SEGMENTED_LAYOUT.SINGLE_ROW}
      />
      <LookPresetChoiceField
        field="density"
        label={t('densityLabel')}
        hint={t('densityDescription')}
        options={densityOptions}
      />
      <CardStyleField />
      <LookPresetChoiceField
        field="imageProportion"
        label={t('imageProportionLabel')}
        hint={t('imageProportionDescription')}
        options={imageProportionOptions}
      />
      <LookPresetChoiceField
        field="dividerWidth"
        label={t('dividerWidthLabel')}
        hint={t('dividerWidthDescription')}
        options={dividerWidthOptions}
      />
    </LookCard>
  );
};
