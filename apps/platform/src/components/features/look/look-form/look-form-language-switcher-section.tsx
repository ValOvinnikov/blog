'use client';

import {
  LANGUAGE_SWITCHER_STYLE,
  type TLanguageSwitcherStyle,
} from '@blog/config';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import { useTranslations } from 'next-intl';

import type { TLookFormFieldSetter } from './look-form';
import { lookFormVariants } from './look-form-variants';

export type TLookFormLanguageSwitcherSectionProps = {
  languageSwitcherStyle: TLanguageSwitcherStyle;
  hasMultipleLanguages: boolean;
  onFieldChange: TLookFormFieldSetter;
  isArchived: boolean;
  archivedNoticeId: string;
};

export const LookFormLanguageSwitcherSection = ({
  languageSwitcherStyle,
  hasMultipleLanguages,
  onFieldChange,
  isArchived,
  archivedNoticeId,
}: TLookFormLanguageSwitcherSectionProps) => {
  const t = useTranslations('lookForm');
  const { field, fieldLabel, fieldHint } = lookFormVariants();

  const languageSwitcherLabel = t('languageSwitcherLabel');

  const languageSwitcherOptions = Object.values(LANGUAGE_SWITCHER_STYLE).map(
    (style) => ({
      value: style,
      label: t(`languageSwitcherOptionLabel.${style}`),
    }),
  );

  return (
    <div className={field()}>
      <span className={fieldLabel()}>{languageSwitcherLabel}</span>
      {hasMultipleLanguages ? (
        <>
          <p className={fieldHint()}>{t('languageSwitcherDescription')}</p>
          <SegmentedControl<TLanguageSwitcherStyle>
            ariaLabel={languageSwitcherLabel}
            options={languageSwitcherOptions}
            value={languageSwitcherStyle}
            onChange={(style) => onFieldChange('languageSwitcherStyle', style)}
            isDisabled={isArchived}
            aria-describedby={isArchived ? archivedNoticeId : undefined}
          />
        </>
      ) : (
        <p className={fieldHint()}>{t('languageSwitcherSingleLanguage')}</p>
      )}
    </div>
  );
};
