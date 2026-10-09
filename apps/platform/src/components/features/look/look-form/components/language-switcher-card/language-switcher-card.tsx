import {
  LANGUAGE_SWITCHER_STYLE,
  type TLanguageSwitcherStyle,
} from '@blog/config';
import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import type { TLookFormFieldSetter } from '@platform/utils/default-look-values/default-look-values';
import { useTranslations } from 'next-intl';

import { languageSwitcherCardVariants } from './language-switcher-card-variants';

export type TLanguageSwitcherCardProps = {
  languageSwitcherStyle: TLanguageSwitcherStyle;
  hasMultipleLanguages: boolean;
  onFieldChange: TLookFormFieldSetter;
  hasUnsavedChanges: boolean;
  isArchived: boolean;
  archivedNoticeId: string;
};

export const LanguageSwitcherCard = ({
  languageSwitcherStyle,
  hasMultipleLanguages,
  onFieldChange,
  hasUnsavedChanges,
  isArchived,
  archivedNoticeId,
}: TLanguageSwitcherCardProps) => {
  const t = useTranslations('lookForm');
  const { switcher, note } = languageSwitcherCardVariants();

  const languageSwitcherLabel = t('languageSwitcherLabel');

  const languageSwitcherOptions = Object.values(LANGUAGE_SWITCHER_STYLE).map(
    (style) => ({
      value: style,
      label: t(`languageSwitcherOptionLabel.${style}`),
    }),
  );

  return (
    <LookCard
      title={languageSwitcherLabel}
      description={t('languageSwitcherDescription')}
      hasUnsavedChanges={hasUnsavedChanges}
    >
      {hasMultipleLanguages ? (
        <SegmentedControl<TLanguageSwitcherStyle>
          className={switcher()}
          ariaLabel={languageSwitcherLabel}
          options={languageSwitcherOptions}
          value={languageSwitcherStyle}
          onChange={(style) => onFieldChange('languageSwitcherStyle', style)}
          isDisabled={isArchived}
          aria-describedby={isArchived ? archivedNoticeId : undefined}
        />
      ) : (
        <p className={note()}>{t('languageSwitcherSingleLanguage')}</p>
      )}
    </LookCard>
  );
};
