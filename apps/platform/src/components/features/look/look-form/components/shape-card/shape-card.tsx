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
import { useLookFieldLock } from '@platform/components/features/look/look-form/use-look-field-lock';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import { useTranslations } from 'next-intl';

export const ShapeCard = () => {
  const {
    values: { radiusScale, density, cardStyle, headerControlStyle },
    updateField,
  } = useLookForm();
  const t = useTranslations('lookForm');
  const radiusScaleLock = useLookFieldLock('radiusScale');
  const densityLock = useLookFieldLock('density');
  const cardStyleLock = useLookFieldLock('cardStyle');
  const headerControlStyleLock = useLookFieldLock('headerControlStyle');

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
      card="shape"
      title={t('shapeHeading')}
      description={t('shapeDescription')}
    >
      <LookField
        label={radiusScaleLabel}
        hint={t('radiusScaleDescription')}
        isGroup={true}
        lock={radiusScaleLock.lock}
      >
        <SegmentedControl<TRadiusScale>
          options={radiusOptions}
          value={radiusScale}
          onChange={(scale) => updateField('radiusScale', scale)}
          isDisabled={radiusScaleLock.isDisabled}
          aria-describedby={radiusScaleLock.describedBy}
        />
      </LookField>

      <LookField
        label={densityLabel}
        hint={t('densityDescription')}
        isGroup={true}
        lock={densityLock.lock}
      >
        <SegmentedControl<TDensity>
          options={densityOptions}
          value={density}
          onChange={(option) => updateField('density', option)}
          isDisabled={densityLock.isDisabled}
          aria-describedby={densityLock.describedBy}
        />
      </LookField>

      <LookField
        label={cardStyleLabel}
        hint={t('cardStyleDescription')}
        isGroup={true}
        lock={cardStyleLock.lock}
      >
        <SegmentedControl<TCardStyle>
          options={cardStyleOptions}
          value={cardStyle}
          onChange={(style) => updateField('cardStyle', style)}
          isDisabled={cardStyleLock.isDisabled}
          aria-describedby={cardStyleLock.describedBy}
        />
      </LookField>

      <LookField
        label={headerControlStyleLabel}
        hint={t('headerControlStyleDescription')}
        isGroup={true}
        lock={headerControlStyleLock.lock}
      >
        <SegmentedControl<THeaderControlStyle>
          options={headerControlStyleOptions}
          value={headerControlStyle}
          onChange={(style) => updateField('headerControlStyle', style)}
          isDisabled={headerControlStyleLock.isDisabled}
          aria-describedby={headerControlStyleLock.describedBy}
        />
      </LookField>
    </LookCard>
  );
};
