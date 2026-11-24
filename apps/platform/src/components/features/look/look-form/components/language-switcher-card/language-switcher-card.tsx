import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import { LookChoiceField } from '@platform/components/features/look/look-form/components/look-choice-field';
import { toLookGlyphOptions } from '@platform/components/features/look/look-form/components/look-option-glyph';
import { useLookRowLock } from '@platform/components/features/look/look-form/use-look-row-lock';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { LOOK_ROW } from '@platform/constants/look-row';
import { SEGMENTED_LAYOUT } from '@platform/constants/segmented-control';
import { CARD_FIELDS } from '@platform/utils/look-form-values/look-form-values';
import { LANGUAGE_SWITCHER_STYLE } from '@shinefold/config';
import { LOOK_FIELD } from '@shinefold/db/constants';
import { useTranslations } from 'next-intl';

import { languageSwitcherCardVariants } from './language-switcher-card-variants';

export type TLanguageSwitcherCardProps = {
  hasMultipleLanguages: boolean;
  summary: string;
};

export const LanguageSwitcherCard = ({
  hasMultipleLanguages,
  summary,
}: TLanguageSwitcherCardProps) => {
  const { isLocked: isPlanLocked } = useLookForm();
  const t = useTranslations('lookForm');
  const { hasGrowthBadge } = useLookRowLock(
    CARD_FIELDS[LOOK_ROW.LANGUAGE_SWITCHER],
  );
  const isStylePlanLocked = isPlanLocked(LOOK_FIELD.LANGUAGE_SWITCHER_STYLE);

  const languageSwitcherOptions = toLookGlyphOptions(
    'languageSwitcherStyle',
    LANGUAGE_SWITCHER_STYLE,
    (style) => t(`languageSwitcherOptionLabel.${style}`),
    (style) => t(`languageSwitcherOptionDescription.${style}`),
  );
  const description = t('languageSwitcherDescription');

  return (
    <LookCard
      summary={summary}
      card={LOOK_ROW.LANGUAGE_SWITCHER}
      description={isStylePlanLocked ? undefined : description}
      lockLine={
        isStylePlanLocked ? t('languageSwitcherFreeDescription') : undefined
      }
      hasGrowthBadge={hasGrowthBadge}
    >
      {isStylePlanLocked || hasMultipleLanguages ? (
        <LookChoiceField
          field={LOOK_FIELD.LANGUAGE_SWITCHER_STYLE}
          label={t('languageSwitcherStyleLabel')}
          hint={isStylePlanLocked ? description : undefined}
          options={languageSwitcherOptions}
          layout={SEGMENTED_LAYOUT.WIDE}
        />
      ) : (
        <p className={languageSwitcherCardVariants()}>
          {t('languageSwitcherSingleLanguage')}
        </p>
      )}
    </LookCard>
  );
};
