import {
  CARD_STYLE,
  DENSITY,
  HEADER_CONTROL_STYLE,
  RADIUS_SCALE,
  type TCardStyle,
  type TDensity,
  type THeaderControlStyle,
  type TRadiusScale,
} from '@blog/config';
import { toOptions } from '@blog/utils/primitives';
import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import { LookField } from '@platform/components/features/look/look-form/components/look-field';
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
    values: { radiusScale, density, cardStyle, headerControlStyle },
    updateField,
  } = useLookForm();
  const t = useTranslations('lookForm');
  const radiusScaleLock = useLookFieldLock('radiusScale');
  const densityLock = useLookFieldLock('density');
  const cardStyleLock = useLookFieldLock('cardStyle');
  const headerControlStyleLock = useLookFieldLock('headerControlStyle');
  const { lockLine, hasGrowthBadge } = useLookRowLock(
    CARD_FIELDS[LOOK_ROW.SHAPE],
  );

  const radiusOptions = toOptions(RADIUS_SCALE, (scale) =>
    t(`radiusScaleOptionLabel.${scale}`),
  );

  const densityOptions = toOptions(DENSITY, (option) =>
    t(`densityOptionLabel.${option}`),
  );

  const cardStyleOptions = toOptions(CARD_STYLE, (style) =>
    t(`cardStyleOptionLabel.${style}`),
  );

  const headerControlStyleOptions = Object.values(HEADER_CONTROL_STYLE).map(
    (style) => ({
      value: style,
      label: t(`headerControlStyleOptionLabel.${style}`),
      description: t(`headerControlStyleOptionDescription.${style}`),
    }),
  );

  const radiusScaleLabel = t('radiusScaleLabel');
  const densityLabel = t('densityLabel');
  const cardStyleLabel = t('cardStyleLabel');
  const headerControlStyleLabel = t('headerControlStyleLabel');

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
          isDisabled={radiusScaleLock.isDisabled}
          isLocked={radiusScaleLock.isLocked}
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
          isDisabled={densityLock.isDisabled}
          isLocked={densityLock.isLocked}
        />
        <PresetValueButton field="density" fieldLabel={densityLabel} />
      </LookField>

      <LookField
        field="cardStyle"
        label={cardStyleLabel}
        hint={t('cardStyleDescription')}
        isGroup={true}
        labelId={cardStyleLock.labelId}
        growthBadgeId={cardStyleLock.growthBadgeId}
      >
        <SegmentedControl<TCardStyle>
          aria={cardStyleLock.aria}
          options={cardStyleOptions}
          value={cardStyle}
          onChange={(style) => updateField('cardStyle', style)}
          isDisabled={cardStyleLock.isDisabled}
          isLocked={cardStyleLock.isLocked}
        />
        <PresetValueButton field="cardStyle" fieldLabel={cardStyleLabel} />
      </LookField>

      <LookField
        field="headerControlStyle"
        label={headerControlStyleLabel}
        hint={t('headerControlStyleDescription')}
        isGroup={true}
        labelId={headerControlStyleLock.labelId}
        growthBadgeId={headerControlStyleLock.growthBadgeId}
      >
        <SegmentedControl<THeaderControlStyle>
          aria={headerControlStyleLock.aria}
          options={headerControlStyleOptions}
          value={headerControlStyle}
          onChange={(style) => updateField('headerControlStyle', style)}
          isDisabled={headerControlStyleLock.isDisabled}
          isLocked={headerControlStyleLock.isLocked}
        />
        <PresetValueButton
          field="headerControlStyle"
          fieldLabel={headerControlStyleLabel}
        />
      </LookField>
    </LookCard>
  );
};
