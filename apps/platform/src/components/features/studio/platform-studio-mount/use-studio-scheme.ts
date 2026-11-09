import type { TStudioMountProps } from '@blog/studio';
import { STUDIO_SCHEME } from '@platform/constants/theme';
import { themePreferenceFor } from '@platform/utils/theme-preference/theme-preference';
import { useThemePreference } from '@platform/utils/use-theme-preference/use-theme-preference';

export type TStudioSchemeProps = Required<
  Pick<TStudioMountProps, 'scheme' | 'onSchemeChange'>
>;

export const useStudioScheme = (): TStudioSchemeProps => {
  const { preference, choose } = useThemePreference();

  return {
    scheme: STUDIO_SCHEME[preference],
    onSchemeChange: (nextScheme) => choose(themePreferenceFor(nextScheme)),
  };
};
