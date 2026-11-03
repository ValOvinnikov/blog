import { COLOR_SCHEME } from '@blog/config';
import type { TStudioMountProps } from '@blog/studio';
import { MEDIA_QUERY } from '@platform/constants/media-query';
import { DATA_THEME, THEME_PREFERENCE } from '@platform/constants/theme';
import { themePreferenceFor } from '@platform/utils/theme-preference/theme-preference';
import { useMediaQuery } from '@platform/utils/use-media-query/use-media-query';
import { useThemePreference } from '@platform/utils/use-theme-preference/use-theme-preference';

export type TStudioSchemeProps = Required<
  Pick<TStudioMountProps, 'scheme' | 'onSchemeChange'>
>;

export const useStudioScheme = (): TStudioSchemeProps => {
  const { preference, choose } = useThemePreference();
  const prefersDark = useMediaQuery(MEDIA_QUERY.PREFERS_DARK);

  const deviceColorScheme = prefersDark
    ? COLOR_SCHEME.DARK
    : COLOR_SCHEME.LIGHT;
  const colorScheme =
    preference === THEME_PREFERENCE.SYSTEM ? deviceColorScheme : preference;

  return {
    scheme: DATA_THEME[colorScheme],
    onSchemeChange: (nextScheme) => choose(themePreferenceFor(nextScheme)),
  };
};
