import { useEffect, useState } from 'react';

export type TTokenValues = Record<string, { light: string; dark: string }>;

/**
 * Resolves each given CSS custom property to its computed value in both
 * light and dark mode, by mounting two off-screen probe elements (one plain,
 * one `.dark`-scoped) and reading `getComputedStyle`. Storybook-only: jsdom
 * cannot resolve `var()` from stylesheets in Vitest, so this hook has no
 * unit test — it's verified visually via Storybook.
 */
export const useTokenValues = (cssVars: readonly string[]): TTokenValues => {
  const [values, setValues] = useState<TTokenValues>({});

  useEffect(() => {
    const light = document.createElement('div');
    const dark = document.createElement('div');
    dark.className = 'dark';
    light.style.position = 'absolute';
    light.style.visibility = 'hidden';
    dark.style.position = 'absolute';
    dark.style.visibility = 'hidden';

    document.body.append(light, dark);

    const lightStyle = getComputedStyle(light);
    const darkStyle = getComputedStyle(dark);

    const next: TTokenValues = {};
    for (const cssVar of cssVars) {
      next[cssVar] = {
        light: lightStyle.getPropertyValue(cssVar).trim(),
        dark: darkStyle.getPropertyValue(cssVar).trim(),
      };
    }
    // Reading computed styles from probe elements is a DOM measurement, not
    // state mirroring — there is no way to know the resolved CSS var values
    // before the probes are mounted, so this must happen inside the effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValues(next);

    return () => {
      light.remove();
      dark.remove();
    };
  }, [cssVars]);

  return values;
};
