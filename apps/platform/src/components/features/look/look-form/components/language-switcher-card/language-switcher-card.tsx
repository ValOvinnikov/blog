import {
  LANGUAGE_SWITCHER_STYLE,
  type TLanguageSwitcherStyle,
} from '@blog/config';
import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import { useSettingsFormState } from '@platform/context/settings-form-provider';
import { useTranslations } from 'next-intl';

import { languageSwitcherCardVariants } from './language-switcher-card-variants';

export type TLanguageSwitcherCardProps = {
  hasMultipleLanguages: boolean;
};

export const LanguageSwitcherCard = ({
  hasMultipleLanguages,
}: TLanguageSwitcherCardProps) => {
  const { isArchived, archivedDescribedBy } = useSettingsFormState();
  const {
    values: { languageSwitcherStyle },
    updateField,
  } = useLookForm();
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
      card="languageSwitcher"
      title={languageSwitcherLabel}
      description={t('languageSwitcherDescription')}
    >
      {hasMultipleLanguages ? (
        <SegmentedControl<TLanguageSwitcherStyle>
          className={switcher()}
          ariaLabel={languageSwitcherLabel}
          options={languageSwitcherOptions}
          value={languageSwitcherStyle}
          onChange={(style) => updateField('languageSwitcherStyle', style)}
          isDisabled={isArchived}
          aria-describedby={archivedDescribedBy}
        />
      ) : (
        <p className={note()}>{t('languageSwitcherSingleLanguage')}</p>
      )}
    </LookCard>
  );
};
