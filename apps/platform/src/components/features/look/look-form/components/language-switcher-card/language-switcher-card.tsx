import { Field } from '@base-ui/react/field';
import {
  LANGUAGE_SWITCHER_STYLE,
  type TLanguageSwitcherStyle,
} from '@blog/config';
import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import { useLookFieldLock } from '@platform/components/features/look/look-form/use-look-field-lock';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { LockedReason } from '@platform/components/shared/locked-reason';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import { useTranslations } from 'next-intl';

import { languageSwitcherCardVariants } from './language-switcher-card-variants';

export type TLanguageSwitcherCardProps = {
  hasMultipleLanguages: boolean;
};

export const LanguageSwitcherCard = ({
  hasMultipleLanguages,
}: TLanguageSwitcherCardProps) => {
  const {
    values: { languageSwitcherStyle },
    updateField,
  } = useLookForm();
  const t = useTranslations('lookForm');
  const { isDisabled, describedBy, lock } = useLookFieldLock(
    'languageSwitcherStyle',
  );
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
        <Field.Root>
          {lock && <LockedReason id={lock.id}>{lock.reason}</LockedReason>}
          <SegmentedControl<TLanguageSwitcherStyle>
            className={switcher()}
            ariaLabel={languageSwitcherLabel}
            options={languageSwitcherOptions}
            value={languageSwitcherStyle}
            onChange={(style) => updateField('languageSwitcherStyle', style)}
            isDisabled={isDisabled}
            aria-describedby={describedBy}
          />
        </Field.Root>
      ) : (
        <p className={note()}>{t('languageSwitcherSingleLanguage')}</p>
      )}
    </LookCard>
  );
};
