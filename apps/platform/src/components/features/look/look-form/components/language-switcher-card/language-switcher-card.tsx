import {
  LANGUAGE_SWITCHER_STYLE,
  type TLanguageSwitcherStyle,
} from '@blog/config';
import { LOOK_FIELD } from '@blog/db/constants';
import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import { LookField } from '@platform/components/features/look/look-form/components/look-field';
import { useLookFieldLock } from '@platform/components/features/look/look-form/use-look-field-lock';
import { useLookRowLock } from '@platform/components/features/look/look-form/use-look-row-lock';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import { LOOK_ROW } from '@platform/constants/look-row';
import { CARD_FIELDS } from '@platform/utils/look-form-values/look-form-values';
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
  const {
    values: { languageSwitcherStyle },
    updateField,
    isLocked: isPlanLocked,
  } = useLookForm();
  const t = useTranslations('lookForm');
  const lock = useLookFieldLock(LOOK_FIELD.LANGUAGE_SWITCHER_STYLE);
  const { hasGrowthBadge } = useLookRowLock(
    CARD_FIELDS[LOOK_ROW.LANGUAGE_SWITCHER],
  );
  const isStylePlanLocked = isPlanLocked(LOOK_FIELD.LANGUAGE_SWITCHER_STYLE);

  const languageSwitcherOptions = Object.values(LANGUAGE_SWITCHER_STYLE).map(
    (style) => ({
      value: style,
      label: t(`languageSwitcherOptionLabel.${style}`),
      description: t(`languageSwitcherOptionDescription.${style}`),
    }),
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
        <LookField
          field="languageSwitcherStyle"
          label={t('languageSwitcherStyleLabel')}
          hint={isStylePlanLocked ? description : undefined}
          isGroup={true}
          labelId={lock.labelId}
          growthBadgeId={lock.growthBadgeId}
        >
          <SegmentedControl<TLanguageSwitcherStyle>
            aria={lock.aria}
            options={languageSwitcherOptions}
            value={languageSwitcherStyle}
            onChange={(style) => updateField('languageSwitcherStyle', style)}
            lock={lock}
          />
        </LookField>
      ) : (
        <p className={languageSwitcherCardVariants()}>
          {t('languageSwitcherSingleLanguage')}
        </p>
      )}
    </LookCard>
  );
};
