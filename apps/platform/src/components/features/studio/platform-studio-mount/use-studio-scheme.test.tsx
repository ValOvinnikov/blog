import { COLOR_SCHEME } from '@blog/config';
import { MEDIA_QUERY } from '@platform/constants/media-query';
import { DATA_THEME, THEME_PREFERENCE } from '@platform/constants/theme';
import { act, renderHook } from '@platform/testing/custom-render';
import {
  DATA_THEME_ATTRIBUTE,
  resetThemePreference,
} from '@platform/testing/theme-preference';
import { storeThemePreference } from '@platform/utils/theme-preference/theme-preference';
import { THEME_PREFERENCE_COOKIE } from '@platform/utils/theme-preference-cookie/theme-preference-cookie';

import { useStudioScheme } from './use-studio-scheme';

const LIGHT_SCHEME = DATA_THEME[COLOR_SCHEME.LIGHT];
const DARK_SCHEME = DATA_THEME[COLOR_SCHEME.DARK];
const STUDIO_SYSTEM_SCHEME = 'system';

const stubMatchMedia = window.matchMedia;

const stubDeviceSetting = (isInitiallyDark: boolean) => {
  const listeners = new Set<() => void>();
  let isDark = isInitiallyDark;

  vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
    ...stubMatchMedia(query),
    matches: query === MEDIA_QUERY.PREFERS_DARK && isDark,
    addEventListener: (_type: string, listener: () => void) =>
      listeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) =>
      listeners.delete(listener),
  }));

  return (nextIsDark: boolean) => {
    isDark = nextIsDark;
    act(() => listeners.forEach((listener) => listener()));
  };
};

const storeInitialPreference = (scheme: string) => {
  document.documentElement.dataset.theme = scheme;
};

describe(useStudioScheme.name, () => {
  afterEach(resetThemePreference);

  it.each([
    {
      stored: THEME_PREFERENCE.LIGHT,
      scheme: LIGHT_SCHEME,
      isDeviceDark: true,
    },
    { stored: THEME_PREFERENCE.DARK, scheme: DARK_SCHEME, isDeviceDark: false },
  ])(
    'passes $scheme for a stored $stored preference, whatever the device setting',
    ({ scheme, isDeviceDark }) => {
      stubDeviceSetting(isDeviceDark);
      storeInitialPreference(scheme);

      const { result } = renderHook(useStudioScheme);

      expect(result.current.scheme).toBe(scheme);
    },
  );

  it.each([
    { isDeviceDark: true, scheme: DARK_SCHEME },
    { isDeviceDark: false, scheme: LIGHT_SCHEME },
  ])(
    'passes $scheme with System when the device is dark: $isDeviceDark',
    ({ isDeviceDark, scheme }) => {
      stubDeviceSetting(isDeviceDark);

      const { result } = renderHook(useStudioScheme);

      expect(result.current.scheme).toBe(scheme);
    },
  );

  it('follows a device setting change with System, without a reload', () => {
    const changeDeviceSetting = stubDeviceSetting(false);
    const { result } = renderHook(useStudioScheme);

    changeDeviceSetting(true);

    expect(result.current.scheme).toBe(DARK_SCHEME);
  });

  it('follows a preference chosen elsewhere in the admin', () => {
    stubDeviceSetting(false);
    const { result } = renderHook(useStudioScheme);

    act(() => storeThemePreference(THEME_PREFERENCE.DARK));

    expect(result.current.scheme).toBe(DARK_SCHEME);
  });

  it.each([
    { chosen: LIGHT_SCHEME, stored: THEME_PREFERENCE.LIGHT },
    { chosen: DARK_SCHEME, stored: THEME_PREFERENCE.DARK },
  ])(
    'stores $stored and repaints the admin when the Studio chooses $chosen',
    ({ chosen, stored }) => {
      stubDeviceSetting(false);
      const { result } = renderHook(useStudioScheme);

      act(() => result.current.onSchemeChange(chosen));

      expect(document.cookie).toBe(`${THEME_PREFERENCE_COOKIE}=${stored}`);
      expect(document.documentElement).toHaveAttribute(
        DATA_THEME_ATTRIBUTE,
        chosen,
      );
      expect(result.current.scheme).toBe(chosen);
    },
  );

  it('hands the admin back to the device setting when the Studio chooses System', () => {
    stubDeviceSetting(true);
    storeInitialPreference(LIGHT_SCHEME);
    const { result } = renderHook(useStudioScheme);

    act(() => result.current.onSchemeChange(STUDIO_SYSTEM_SCHEME));

    expect(document.cookie).toBe(
      `${THEME_PREFERENCE_COOKIE}=${THEME_PREFERENCE.SYSTEM}`,
    );
    expect(document.documentElement).not.toHaveAttribute(DATA_THEME_ATTRIBUTE);
    expect(result.current.scheme).toBe(DARK_SCHEME);
  });
});
