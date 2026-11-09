import { COLOR_SCHEME } from '@blog/config';
import {
  DATA_THEME,
  STUDIO_SCHEME,
  THEME_PREFERENCE,
} from '@platform/constants/theme';
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
const SYSTEM_SCHEME = STUDIO_SCHEME[THEME_PREFERENCE.SYSTEM];

const storeInitialPreference = (scheme: string) => {
  document.documentElement.dataset.theme = scheme;
};

describe(useStudioScheme.name, () => {
  afterEach(resetThemePreference);

  it.each([
    { stored: THEME_PREFERENCE.LIGHT, scheme: LIGHT_SCHEME },
    { stored: THEME_PREFERENCE.DARK, scheme: DARK_SCHEME },
  ])('passes $scheme for a stored $stored preference', ({ scheme }) => {
    storeInitialPreference(scheme);

    const { result } = renderHook(useStudioScheme);

    expect(result.current.scheme).toBe(scheme);
  });

  it('passes system when no preference is stored, so the Studio checks System', () => {
    const { result } = renderHook(useStudioScheme);

    expect(result.current.scheme).toBe(SYSTEM_SCHEME);
  });

  it.each([
    { chosen: THEME_PREFERENCE.DARK, scheme: DARK_SCHEME },
    { chosen: THEME_PREFERENCE.SYSTEM, scheme: SYSTEM_SCHEME },
  ])('follows $chosen chosen elsewhere in the admin', ({ chosen, scheme }) => {
    storeInitialPreference(LIGHT_SCHEME);
    const { result } = renderHook(useStudioScheme);

    act(() => storeThemePreference(chosen));

    expect(result.current.scheme).toBe(scheme);
  });

  it.each([
    { chosen: LIGHT_SCHEME, stored: THEME_PREFERENCE.LIGHT },
    { chosen: DARK_SCHEME, stored: THEME_PREFERENCE.DARK },
  ])(
    'stores $stored and repaints the admin when the Studio chooses $chosen',
    ({ chosen, stored }) => {
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
    storeInitialPreference(LIGHT_SCHEME);
    const { result } = renderHook(useStudioScheme);

    act(() => result.current.onSchemeChange(SYSTEM_SCHEME));

    expect(document.cookie).toBe(
      `${THEME_PREFERENCE_COOKIE}=${THEME_PREFERENCE.SYSTEM}`,
    );
    expect(document.documentElement).not.toHaveAttribute(DATA_THEME_ATTRIBUTE);
    expect(result.current.scheme).toBe(SYSTEM_SCHEME);
  });
});
