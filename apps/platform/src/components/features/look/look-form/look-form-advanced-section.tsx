'use client';

import {
  DENSITY,
  RADIUS_SCALE,
  type TDensity,
  type TFontChoice,
  type TRadiusScale,
} from '@blog/config';
import { FontPicker } from '@platform/components/shared/font-picker';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import { useTranslations } from 'next-intl';

import type { TLookFormFieldSetter } from './look-form';
import { lookFormVariants } from './look-form-variants';

export type TLookFormAdvancedSectionProps = {
  headingFont: TFontChoice;
  bodyFont: TFontChoice;
  radiusScale: TRadiusScale;
  density: TDensity;
  onFieldChange: TLookFormFieldSetter;
  isArchived: boolean;
  archivedNoticeId: string;
};

/** Fonts, radius, and density — the controls collapsed under "Advanced" by default. */
export const LookFormAdvancedSection = ({
  headingFont,
  bodyFont,
  radiusScale,
  density,
  onFieldChange,
  isArchived,
  archivedNoticeId,
}: TLookFormAdvancedSectionProps) => {
  const archivedDescribedBy = isArchived ? archivedNoticeId : undefined;
  const t = useTranslations('lookForm');
  const { field, fieldLabel, fieldHint } = lookFormVariants();

  const radiusOptions = Object.values(RADIUS_SCALE).map((scale) => ({
    value: scale,
    label: t(`radiusScaleOptionLabel.${scale}`),
  }));

  const densityOptions = Object.values(DENSITY).map((option) => ({
    value: option,
    label: t(`densityOptionLabel.${option}`),
  }));

  const headingFontLabel = t('headingFontLabel');
  const bodyFontLabel = t('bodyFontLabel');
  const radiusScaleLabel = t('radiusScaleLabel');
  const densityLabel = t('densityLabel');

  return (
    <>
      <div className={field()}>
        <span className={fieldLabel()}>{headingFontLabel}</span>
        <p className={fieldHint()}>{t('headingFontDescription')}</p>
        <FontPicker
          ariaLabel={headingFontLabel}
          value={headingFont}
          onChange={(font) => onFieldChange('headingFont', font)}
          isDisabled={isArchived}
          aria-describedby={archivedDescribedBy}
        />
      </div>

      <div className={field()}>
        <span className={fieldLabel()}>{bodyFontLabel}</span>
        <FontPicker
          ariaLabel={bodyFontLabel}
          value={bodyFont}
          onChange={(font) => onFieldChange('bodyFont', font)}
          isDisabled={isArchived}
          aria-describedby={archivedDescribedBy}
        />
      </div>

      <div className={field()}>
        <span className={fieldLabel()}>{radiusScaleLabel}</span>
        <p className={fieldHint()}>{t('radiusScaleDescription')}</p>
        <SegmentedControl<TRadiusScale>
          ariaLabel={radiusScaleLabel}
          options={radiusOptions}
          value={radiusScale}
          onChange={(scale) => onFieldChange('radiusScale', scale)}
          isDisabled={isArchived}
          aria-describedby={archivedDescribedBy}
        />
      </div>

      <div className={field()}>
        <span className={fieldLabel()}>{densityLabel}</span>
        <p className={fieldHint()}>{t('densityDescription')}</p>
        <SegmentedControl<TDensity>
          ariaLabel={densityLabel}
          options={densityOptions}
          value={density}
          onChange={(option) => onFieldChange('density', option)}
          isDisabled={isArchived}
          aria-describedby={archivedDescribedBy}
        />
      </div>
    </>
  );
};
