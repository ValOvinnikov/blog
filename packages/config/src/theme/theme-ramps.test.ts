import { readFileSync } from 'node:fs';

import {
  ACCENT_RAMP_DARK,
  ACCENT_RAMP_LIGHT,
  formatOklchRamp,
  IMAGE_SCRIM_RAMP,
  LOGO_RAMP_DARK,
  LOGO_RAMP_LIGHT,
  type TOklchRamp,
} from './theme-declarations';
import {
  CODE_SYNTAX_RAMP_DARK,
  CODE_SYNTAX_RAMP_LIGHT,
  NEUTRAL_RAMP_DARK,
  NEUTRAL_RAMP_LIGHT,
  NEUTRAL_SCRIM_RAMP,
  STATUS_RAMP_DARK,
  STATUS_RAMP_LIGHT,
} from './theme-ramps';

const CONSOLE_HUE = 250;

const readRepoFile = (path: string): string =>
  readFileSync(new URL(`../../../../${path}`, import.meta.url), 'utf8');

const readOklchDeclarations = (
  css: string,
  selector: string,
): Record<string, string> => {
  const flattened = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
  const block = flattened.split(` ${selector} { `)[1]?.split(' }')[0] ?? '';

  return Object.fromEntries(
    [...block.matchAll(/(--[\w-]+): oklch\( ?([^)]*?) ?\);/g)].map(
      ([, property, value]) => [property, `oklch(${value})`],
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

  it("match the code-block colours apps/web's index.css sets in :root", () => {
    expect(readOklchDeclarations(webCss, ':root')).toEqual(
      formatRamps(CODE_SYNTAX_RAMP_LIGHT),
    );
  });

  it("match the code-block colours apps/web's index.css sets in .dark", () => {
    expect(readOklchDeclarations(webCss, '.dark')).toEqual(
      formatRamps(CODE_SYNTAX_RAMP_DARK),
    );
  });
});
