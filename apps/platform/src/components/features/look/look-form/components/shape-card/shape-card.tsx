import { DENSITY, RADIUS_SCALE } from '@blog/config';
import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import { LookOptionGlyph } from '@platform/components/features/look/look-form/components/look-option-glyph';
import { LookPresetChoiceField } from '@platform/components/features/look/look-form/components/look-preset-choice-field';
import { useLookRowLock } from '@platform/components/features/look/look-form/use-look-row-lock';
import { LOOK_ROW } from '@platform/constants/look-row';
import { CARD_FIELDS } from '@platform/utils/look-form-values/look-form-values';
import { useTranslations } from 'next-intl';

export type TShapeCardProps = {
  summary: string;
};

export const ShapeCard = ({ summary }: TShapeCardProps) => {
  const t = useTranslations('lookForm');
  const { lockLine, hasGrowthBadge } = useLookRowLock(
    CARD_FIELDS[LOOK_ROW.SHAPE],
  );

  const radiusOptions = Object.values(RADIUS_SCALE).map((scale) => ({
    value: scale,
    label: t(`radiusScaleOptionLabel.${scale}`),
    glyph: <LookOptionGlyph field="radiusScale" value={scale} />,
  }));

  const densityOptions = Object.values(DENSITY).map((option) => ({
    value: option,
    label: t(`densityOptionLabel.${option}`),
    glyph: <LookOptionGlyph field="density" value={option} />,
  }));

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
        field="density"
        label={t('densityLabel')}
        hint={t('densityDescription')}
        options={densityOptions}
      />
    </LookCard>
  );
};
