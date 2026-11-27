import { LookChoiceField } from '@platform/components/features/look/look-form/components/look-choice-field';
import { toSkinSwatchOptions } from '@platform/components/features/look/look-form/components/look-option-glyph';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { LockedReason } from '@platform/components/shared/locked-reason';
import { ICONS } from '@shinefold/config';
import { isUndefined } from '@shinefold/utils/primitives';
import { useTranslations } from 'next-intl';

export const HeaderBackgroundField = () => {
  const {
    values: { accentHue, logoDark },
  } = useLookForm();
  const t = useTranslations('lookForm');

  const skinOptions = toSkinSwatchOptions(accentHue, (skin) =>
    t(`skinLabel.${skin}`),
  );

  return (
    <LookChoiceField
      field="headerBackground"
      label={t('headerBackgroundLabel')}
      hint={t('headerBackgroundDescription')}
      options={skinOptions}
    >
      {isUndefined(logoDark.url) && (
        <LockedReason icon={ICONS.INFO}>
          {t('headerBackgroundDarkLogoNote')}
        </LockedReason>
      )}
    </LookChoiceField>
  );
};
