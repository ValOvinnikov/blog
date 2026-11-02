import {
  THEME_PREFERENCE,
  type TThemePreference,
} from '@platform/constants/theme';

export const resolveThemePreference = vi.fn(
  async (): Promise<TThemePreference> => THEME_PREFERENCE.SYSTEM,
);
