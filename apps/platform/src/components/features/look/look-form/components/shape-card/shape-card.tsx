import {
  CARD_STYLE,
  DENSITY,
  RADIUS_SCALE,
  type TCardStyle,
  type TDensity,
  type TRadiusScale,
} from '@blog/config';
import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import { LookField } from '@platform/components/features/look/look-form/components/look-field';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import { useSettingsFormState } from '@platform/context/settings-form-provider';
import type { TLookFormFieldSetter } from '@platform/utils/default-look-values/default-look-values';
import { useTranslations } from 'next-intl';

export type TShapeCardProps = {
  radiusScale: TRadiusScale;
  density: TDensity;
  cardStyle: TCardStyle;
  onFieldChange: TLookFormFieldSetter;
  hasUnsavedChanges: boolean;
};

export const ShapeCard = ({
  radiusScale,
  density,
  cardStyle,
  onFieldChange,
  hasUnsavedChanges,
}: TShapeCardProps) => {
  const { isArchived, archivedDescribedBy } = useSettingsFormState();
  const t = useTranslations('lookForm');

  const radiusOptions = Object.values(RADIUS_SCALE).map((scale) => ({
    value: scale,
    label: t(`radiusScaleOptionLabel.${scale}`),
  }));

  const densityOptions = Object.values(DENSITY).map((option) => ({
    value: option,
    label: t(`densityOptionLabel.${option}`),
  }));

  const cardStyleOptions = Object.values(CARD_STYLE).map((style) => ({
    value: style,
    label: t(`cardStyleOptionLabel.${style}`),
  }));

  const radiusScaleLabel = t('radiusScaleLabel');
  const densityLabel = t('densityLabel');
  const cardStyleLabel = t('cardStyleLabel');

  return (
    <LookCard
      title={t('shapeHeading')}
      description={t('shapeDescription')}
      hasUnsavedChanges={hasUnsavedChanges}
    >
      <LookField
        label={radiusScaleLabel}
        hint={t('radiusScaleDescription')}
        isGroup={true}
      >
        <SegmentedControl<TRadiusScale>
          options={radiusOptions}
          value={radiusScale}
          onChange={(scale) => onFieldChange('radiusScale', scale)}
          isDisabled={isArchived}
          aria-describedby={archivedDescribedBy}
        />
      </LookField>

      <LookField
        label={densityLabel}
        hint={t('densityDescription')}
        isGroup={true}
      >
        <SegmentedControl<TDensity>
          options={densityOptions}
          value={density}
          onChange={(option) => onFieldChange('density', option)}
          isDisabled={isArchived}
          aria-describedby={archivedDescribedBy}
        />
      </LookField>

      <LookField
        label={cardStyleLabel}
        hint={t('cardStyleDescription')}
        isGroup={true}
      >
        <SegmentedControl<TCardStyle>
          options={cardStyleOptions}
          value={cardStyle}
          onChange={(style) => onFieldChange('cardStyle', style)}
          isDisabled={isArchived}
          aria-describedby={archivedDescribedBy}
        />
      </LookField>
    </LookCard>
  );
};
