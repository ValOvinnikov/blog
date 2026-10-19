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
import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import { LookField } from '@platform/components/features/look/look-form/components/look-field';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import { useSettingsFormState } from '@platform/context/settings-form-provider';
import { useTranslations } from 'next-intl';

export const ShapeCard = () => {
  const { isArchived, archivedDescribedBy } = useSettingsFormState();
  const {
    values: { radiusScale, density, cardStyle, headerControlStyle },
    updateField,
  } = useLookForm();
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
      card="shape"
      title={t('shapeHeading')}
      description={t('shapeDescription')}
    >
      <LookField
        label={radiusScaleLabel}
        hint={t('radiusScaleDescription')}
        isGroup={true}
      >
        <SegmentedControl<TRadiusScale>
          options={radiusOptions}
          value={radiusScale}
          onChange={(scale) => updateField('radiusScale', scale)}
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
          onChange={(option) => updateField('density', option)}
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
          onChange={(style) => updateField('cardStyle', style)}
          isDisabled={isArchived}
          aria-describedby={archivedDescribedBy}
        />
      </LookField>

      <LookField
        label={headerControlStyleLabel}
        hint={t('headerControlStyleDescription')}
        isGroup={true}
      >
        <SegmentedControl<THeaderControlStyle>
          options={headerControlStyleOptions}
          value={headerControlStyle}
          onChange={(style) => updateField('headerControlStyle', style)}
          isDisabled={isArchived}
          aria-describedby={archivedDescribedBy}
        />
      </LookField>
    </LookCard>
  );
};
