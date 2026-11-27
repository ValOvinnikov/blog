import { LookChoiceField } from '@platform/components/features/look/look-form/components/look-choice-field';
import { toLookGlyphOptions } from '@platform/components/features/look/look-form/components/look-option-glyph';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { SEGMENTED_LAYOUT } from '@platform/constants/segmented-control';
import { LANGUAGE_SWITCHER_STYLE } from '@shinefold/config';
import { LOOK_FIELD } from '@shinefold/db/constants';
import { useTranslations } from 'next-intl';

import { languageSwitcherStyleFieldVariants } from './language-switcher-style-field-variants';

export type TLanguageSwitcherStyleFieldProps = {
  hasMultipleLanguages: boolean;
};

export const LanguageSwitcherStyleField = ({
  hasMultipleLanguages,
}: TLanguageSwitcherStyleFieldProps) => {
  const { isLocked } = useLookForm();
  const t = useTranslations('lookForm');
  const isPlanLocked = isLocked(LOOK_FIELD.LANGUAGE_SWITCHER_STYLE);

  if (!isPlanLocked && !hasMultipleLanguages) {
    return (
      <p className={languageSwitcherStyleFieldVariants()}>
        {t('languageSwitcherSingleLanguage')}
      </p>
    );
  }

  const options = toLookGlyphOptions(
    'languageSwitcherStyle',
    LANGUAGE_SWITCHER_STYLE,
    (style) => t(`languageSwitcherOptionLabel.${style}`),
    (style) => t(`languageSwitcherOptionDescription.${style}`),
  );

  return (
    <LookChoiceField
      field={LOOK_FIELD.LANGUAGE_SWITCHER_STYLE}
      label={t('languageSwitcherStyleLabel')}
      hint={t(
        isPlanLocked
          ? 'languageSwitcherFreeDescription'
          : 'languageSwitcherDescription',
      )}
      options={options}
      layout={SEGMENTED_LAYOUT.WIDE}
    />
  );
};
