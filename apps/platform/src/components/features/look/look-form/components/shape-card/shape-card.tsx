import {
  DENSITY,
  RADIUS_SCALE,
  type TDensity,
  type TRadiusScale,
} from '@blog/config';
import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import { LookField } from '@platform/components/features/look/look-form/components/look-field';
import { LookOptionGlyph } from '@platform/components/features/look/look-form/components/look-option-glyph';
import { PresetValueButton } from '@platform/components/features/look/look-form/components/preset-value-button';
import { useLookFieldLock } from '@platform/components/features/look/look-form/use-look-field-lock';
import { useLookRowLock } from '@platform/components/features/look/look-form/use-look-row-lock';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import { LOOK_ROW } from '@platform/constants/look-row';
import { CARD_FIELDS } from '@platform/utils/look-form-values/look-form-values';
import { useTranslations } from 'next-intl';

export type TShapeCardProps = {
  summary: string;
};

export const ShapeCard = ({ summary }: TShapeCardProps) => {
  const {
    values: { radiusScale, density },
    updateField,
  } = useLookForm();
  const t = useTranslations('lookForm');
  const radiusScaleLock = useLookFieldLock('radiusScale');
  const densityLock = useLookFieldLock('density');
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

  const radiusScaleLabel = t('radiusScaleLabel');
  const densityLabel = t('densityLabel');

  return (
    <LookCard
      summary={summary}
      card={LOOK_ROW.SHAPE}
      description={t('shapeDescription')}
      lockLine={lockLine}
      hasGrowthBadge={hasGrowthBadge}
    >
      <LookField
        field="radiusScale"
        label={radiusScaleLabel}
        hint={t('radiusScaleDescription')}
        isGroup={true}
        labelId={radiusScaleLock.labelId}
        growthBadgeId={radiusScaleLock.growthBadgeId}
      >
        <SegmentedControl<TRadiusScale>
          aria={radiusScaleLock.aria}
          options={radiusOptions}
          value={radiusScale}
          onChange={(scale) => updateField('radiusScale', scale)}
          lock={radiusScaleLock}
        />
        <PresetValueButton field="radiusScale" fieldLabel={radiusScaleLabel} />
      </LookField>

      <LookField
        field="density"
        label={densityLabel}
        hint={t('densityDescription')}
        isGroup={true}
        labelId={densityLock.labelId}
        growthBadgeId={densityLock.growthBadgeId}
      >
        <SegmentedControl<TDensity>
          aria={densityLock.aria}
          options={densityOptions}
          value={density}
          onChange={(option) => updateField('density', option)}
          lock={densityLock}
        />
        <PresetValueButton field="density" fieldLabel={densityLabel} />
      </LookField>
    </LookCard>
  );
};
