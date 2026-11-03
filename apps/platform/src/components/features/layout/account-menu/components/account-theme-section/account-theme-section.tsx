'use client';

import { ICONS } from '@blog/config';
import { MenuRadioGroup } from '@platform/components/shared/menu-radio-group';
import { THEME_PREFERENCE } from '@platform/constants/theme';
import { useThemePreference } from '@platform/utils/use-theme-preference/use-theme-preference';
import { useTranslations } from 'next-intl';

export const AccountThemeSection = () => {
  const t = useTranslations('account');
  const { preference, choose } = useThemePreference();

  return (
    <MenuRadioGroup
      label={t('themeLabel')}
      hint={t('themeSystemHint')}
      options={[
        {
          value: THEME_PREFERENCE.LIGHT,
          label: t('themeLight'),
          icon: ICONS.SUN,
        },
        {
          value: THEME_PREFERENCE.DARK,
          label: t('themeDark'),
          icon: ICONS.MOON,
        },
        {
          value: THEME_PREFERENCE.SYSTEM,
          label: t('themeSystem'),
          icon: ICONS.MONITOR,
        },
      ]}
      value={preference}
      onValueChange={choose}
    />
  );
};
