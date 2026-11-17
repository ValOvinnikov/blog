import { isUndefined } from '@shinefold/utils/primitives';

import {
  ACCENT_RAMP_DARK,
  ACCENT_RAMP_LIGHT,
  IMAGE_SCRIM_RAMP,
  LOGO_RAMP_DARK,
  LOGO_RAMP_LIGHT,
} from './accent-ramps';
import {
  BRAND_PALETTE,
  NEUTRAL_PALETTE,
  PALETTE,
  STATUS_PALETTE,
} from './palette-ramps';
import {
  formatPaletteDeclarations,
  type TOklchRamp,
  type TOklchStop,
} from './theme-declarations';
import {
  NEUTRAL_RAMP_DARK,
  NEUTRAL_RAMP_LIGHT,
  NEUTRAL_SCRIM_RAMP,
  STATUS_RAMP_DARK,
  STATUS_RAMP_LIGHT,
} from './theme-ramps';

const MOCK_TENANT_HUE = 28;

const THEME_CSS_RAMPS: TOklchRamp[] = [
  NEUTRAL_RAMP_LIGHT,
  NEUTRAL_RAMP_DARK,
  ACCENT_RAMP_LIGHT,
  ACCENT_RAMP_DARK,
  STATUS_RAMP_LIGHT,
  STATUS_RAMP_DARK,
  LOGO_RAMP_LIGHT,
  LOGO_RAMP_DARK,
  IMAGE_SCRIM_RAMP,
  NEUTRAL_SCRIM_RAMP,
];

const opaque = ({ l, c, h }: TOklchStop): TOklchStop =>
  isUndefined(h) ? { l, c } : { l, c, h };

const paletteStops = Object.values(PALETTE).map(opaque);

describe('the palette', () => {
  it.each(THEME_CSS_RAMPS.flatMap((ramp) => Object.entries(ramp)))(
    'holds the colour of %s as a stop',
    (_property, stop) => {
      expect(paletteStops).toContainEqual(opaque(stop));
    },
  );

  it('names every stop after its lightness and chroma', () => {
    for (const [property, { l, c }] of Object.entries(PALETTE)) {
      expect(property).toMatch(
        new RegExp(`-${Math.round(l * 1000)}-${Math.round(c * 1000)}$`),
      );
    }
  });
});

describe(formatPaletteDeclarations, () => {
  const declarations = formatPaletteDeclarations(MOCK_TENANT_HUE);

  it('puts every brand stop at the tenant hue', () => {
    for (const property of Object.keys(BRAND_PALETTE)) {
      expect(declarations[property as keyof typeof declarations]).toMatch(
        new RegExp(` ${MOCK_TENANT_HUE}\\)$`),
      );
    }
  });

  it.each(Object.entries({ ...NEUTRAL_PALETTE, ...STATUS_PALETTE }))(
    'keeps %s at its own hue',
    (property, { h }) => {
      expect(declarations[property as keyof typeof declarations]).toMatch(
        new RegExp(` ${h}\\)$`),
      );
    },
  );
});
