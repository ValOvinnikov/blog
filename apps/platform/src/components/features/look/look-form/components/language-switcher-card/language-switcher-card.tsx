import {
  LANGUAGE_SWITCHER_STYLE,
  type TLanguageSwitcherStyle,
} from '@blog/config';
import { toOptions } from '@blog/utils/primitives';
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
  } = useLookForm();
  const t = useTranslations('lookForm');
  const { isDisabled, isLocked, aria, labelId, growthBadgeId } =
    useLookFieldLock('languageSwitcherStyle');
  const { lockLine, hasGrowthBadge } = useLookRowLock(
    CARD_FIELDS[LOOK_ROW.LANGUAGE_SWITCHER],
    'languageSwitcherFreeDescription',
  );

  const languageSwitcherOptions = toOptions(LANGUAGE_SWITCHER_STYLE, (style) =>
    t(`languageSwitcherOptionLabel.${style}`),
  );
  const description = t('languageSwitcherDescription');

  return (
    <LookCard
      summary={summary}
      card={LOOK_ROW.LANGUAGE_SWITCHER}
      description={isLocked ? undefined : description}
      lockLine={lockLine}
      hasGrowthBadge={hasGrowthBadge}
    >
      {isLocked || hasMultipleLanguages ? (
        <LookField
          field="languageSwitcherStyle"
          label={t('languageSwitcherStyleLabel')}
          hint={isLocked ? description : undefined}
          isGroup={true}
          labelId={labelId}
          growthBadgeId={growthBadgeId}
        >
          <SegmentedControl<TLanguageSwitcherStyle>
            aria={aria}
            options={languageSwitcherOptions}
            value={languageSwitcherStyle}
            onChange={(style) => updateField('languageSwitcherStyle', style)}
            isDisabled={isDisabled}
            isLocked={isLocked}
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
