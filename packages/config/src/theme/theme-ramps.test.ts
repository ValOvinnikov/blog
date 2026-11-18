import {
  readCssBlock,
  readRepoFile,
} from '@shinefold/config/testing/theme-css';

import { PRESET_ID, PRESET_REGISTRY } from '@shinefold/config/constants';

import {
  ACCENT_RAMP_DARK,
  ACCENT_RAMP_LIGHT,
  IMAGE_SCRIM_RAMP,
  LOGO_RAMP_DARK,
  LOGO_RAMP_LIGHT,
} from './accent-ramps';
import { formatOklchRamp, type TOklchRamp } from './theme-declarations';
import {
  CODE_SYNTAX_RAMP_DARK,
  CODE_SYNTAX_RAMP_LIGHT,
  NEUTRAL_RAMP_DARK,
  NEUTRAL_RAMP_LIGHT,
  NEUTRAL_SCRIM_RAMP,
  STATUS_RAMP_DARK,
  STATUS_RAMP_LIGHT,
} from './theme-ramps';

const CONSOLE_HUE = PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens.accentHue;

const readOklchDeclarations = (
  css: string,
  selector: string,
): Record<string, string> => {
  return Object.fromEntries(
    [
      ...readCssBlock(css, selector).matchAll(
        /(--[\w-]+): oklch\( ?([^)]*?) ?\);/g,
      ),
    ].map(([, property, value]) => [property, `oklch(${value})`]),
  );
};

const readLightDarkDeclarations = (
  css: string,
  selector: string,
): Record<string, string>[] => {
  const declarations = [
    ...readCssBlock(css, selector).matchAll(
      /(--[\w-]+): light-dark\((oklch\([^)]*\)), (oklch\([^)]*\))\);/g,
    ),
  ];
  return [1, 2].map((index) =>
    Object.fromEntries(
      declarations.map((match) => [match[1], match[index + 1]]),
    ),
  );
};

const formatRamps = (...ramps: TOklchRamp[]): Record<string, string> =>
  Object.assign({}, ...ramps.map((ramp) => formatOklchRamp(ramp, CONSOLE_HUE)));

describe('theme ramps', () => {
  const themeCss = readRepoFile('configs/tailwind/theme.css');
  const webCss = readRepoFile('apps/web/index.css');

  it('match every OKLCH value theme.css sets in :root', () => {
    expect(readOklchDeclarations(themeCss, ':root')).toEqual(
      formatRamps(
        NEUTRAL_RAMP_LIGHT,
        ACCENT_RAMP_LIGHT,
        STATUS_RAMP_LIGHT,
        LOGO_RAMP_LIGHT,
        IMAGE_SCRIM_RAMP,
        NEUTRAL_SCRIM_RAMP,
      ),
    );
  });

  it('match every OKLCH value theme.css sets in .dark', () => {
    expect(readOklchDeclarations(themeCss, '.dark')).toEqual(
      formatRamps(
        NEUTRAL_RAMP_DARK,
        ACCENT_RAMP_DARK,
        STATUS_RAMP_DARK,
        LOGO_RAMP_DARK,
      ),
    );
  });

  it("match the light and dark code-block colours apps/web's index.css sets", () => {
    expect(
      readLightDarkDeclarations(webCss, ':root, .dark, [data-skin]'),
    ).toEqual([
      formatRamps(CODE_SYNTAX_RAMP_LIGHT),
      formatRamps(CODE_SYNTAX_RAMP_DARK),
    ]);
  });
});
