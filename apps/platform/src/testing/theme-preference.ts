import { THEME_PREFERENCE_COOKIE } from '@platform/utils/theme-preference-cookie/theme-preference-cookie';

export const DATA_THEME_ATTRIBUTE = 'data-theme';

export const resetThemePreference = () => {
  delete document.documentElement.dataset.theme;
  document.cookie = `${THEME_PREFERENCE_COOKIE}=; max-age=0; path=/; SameSite=Lax`;
};
