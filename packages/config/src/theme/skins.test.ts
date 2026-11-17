import {
  BRAND_VARIANT,
  COLOR_SCHEME,
  SKIN_MODE,
  type TColorScheme,
} from '@shinefold/config/constants';

import { SCHEME_RAMPS } from './contrast-scheme-ramps';
import { PALETTE } from './palette-ramps';
import { effectiveSchemeOf, findSkinFailures } from './skin-contrast';
import { PAGE_ROLES, SKIN_FILL_ROLES, type TPaletteStop } from './skin-roles';
import {
  defineSkin,
  SKIN_REGISTRY,
  STORYBOOK_SKINS,
  type TSkin,
} from './skins';

const COLOR_SCHEMES = Object.values(COLOR_SCHEME);

const DARKEST_NEUTRAL = '--palette-neutral-2700' satisfies TPaletteStop;

const MID_NEUTRAL = '--palette-neutral-1300' satisfies TPaletteStop;

const UNREADABLE = 'Unreadable';

const TEXT_MUTED = '--text-muted';

const SKIN_CASES = Object.entries({
  ...SKIN_REGISTRY,
  ...STORYBOOK_SKINS,
}).flatMap(([key, skin]) =>
  COLOR_SCHEMES.map((scheme) => ({ key, skin, scheme })),
);

const failuresOf = ({ mode, roles }: TSkin, scheme: TColorScheme) =>
  findSkinFailures(roles[scheme], scheme, effectiveSchemeOf(mode, scheme));

const paletteValueOf = (stop: TPaletteStop) => {
  const { l, c } = PALETTE[stop];
  return { l, c };
};

describe('the skin registry', () => {
  it.each(SKIN_CASES)(
    '$key clears every contrast pair at every accent hue under $scheme',
    ({ skin, scheme }) => {
      expect(failuresOf(skin, scheme)).toEqual([]);
    },
  );

  it.each(SKIN_CASES)(
    "$key's fills stand apart from its ground under $scheme",
    ({ skin, scheme }) => {
      const roles = skin.roles[scheme];

      for (const fill of SKIN_FILL_ROLES) {
        expect(roles[fill]).not.toBe(roles['--ambient']);
      }
    },
  );

  it.each(COLOR_SCHEMES)('Plain takes the page roles under %s', (scheme) => {
    expect(SKIN_REGISTRY[BRAND_VARIANT.PRIMARY].roles[scheme]).toEqual(
      PAGE_ROLES[scheme],
    );
  });

  it.each(COLOR_SCHEMES)(
    'Shaded sits on the page secondary under %s',
    (scheme) => {
      const roles = SKIN_REGISTRY[BRAND_VARIANT.SECONDARY].roles[scheme];
      const { l, c } = SCHEME_RAMPS[scheme]['--secondary']!;

      expect(paletteValueOf(roles['--ambient'])).toEqual({ l, c });
    },
  );

  it.each(COLOR_SCHEMES)(
    'Brand tint fills with the page tint lifted 10% toward the brand under %s',
    (scheme) => {
      const roles = SKIN_REGISTRY[BRAND_VARIANT.BRAND_PRIMARY].roles[scheme];
      const muted = SCHEME_RAMPS[scheme]['--brand-primary-muted']!;
      const brand = SCHEME_RAMPS[scheme]['--brand-primary']!;
      const { l, c } = paletteValueOf(roles['--brand-primary-muted']);

      expect(paletteValueOf(roles['--ambient'])).toEqual({
        l: muted.l,
        c: muted.c,
      });
      expect(l).toBeCloseTo(muted.l * 0.9 + brand.l * 0.1, 6);
      expect(c).toBeCloseTo(muted.c * 0.9 + brand.c * 0.1, 6);
    },
  );

  it('dresses the brand ground in the brand scrim', () => {
    const { roles } = SKIN_REGISTRY[BRAND_VARIANT.BRAND_PRIMARY];

    expect(roles[COLOR_SCHEME.LIGHT]['--scrim-strong']).toBe(
      '--scrim-brand-strong',
    );
  });
});

describe(defineSkin, () => {
  it.each(COLOR_SCHEMES)(
    'derives an unpinned inverse skin on the darkest neutral that clears every pair under %s',
    (scheme) => {
      const skin = defineSkin('Darkest', {
        ground: {
          [COLOR_SCHEME.LIGHT]: DARKEST_NEUTRAL,
          [COLOR_SCHEME.DARK]: DARKEST_NEUTRAL,
        },
        mode: SKIN_MODE.INVERSE,
      });

      expect(skin.roles[scheme]['--ambient']).toBe(DARKEST_NEUTRAL);
      expect(failuresOf(skin, scheme)).toEqual([]);
    },
  );

  it('moves a role that fails on its ground to a stop that clears', () => {
    const skin = defineSkin('Mid grey', {
      ground: {
        [COLOR_SCHEME.LIGHT]: '--palette-neutral-700',
        [COLOR_SCHEME.DARK]: '--palette-neutral-1400',
      },
      mode: SKIN_MODE.MATCH,
    });
    const light = skin.roles[COLOR_SCHEME.LIGHT];

    expect(light[TEXT_MUTED]).not.toBe(
      PAGE_ROLES[COLOR_SCHEME.LIGHT][TEXT_MUTED],
    );
    expect(failuresOf(skin, COLOR_SCHEME.LIGHT)).toEqual([]);
  });

  it('throws when no stop clears a role on its ground', () => {
    const skin = defineSkin(UNREADABLE, {
      ground: {
        [COLOR_SCHEME.LIGHT]: MID_NEUTRAL,
        [COLOR_SCHEME.DARK]: MID_NEUTRAL,
      },
      mode: SKIN_MODE.MATCH,
      pin: { [COLOR_SCHEME.LIGHT]: { '--text': '--palette-neutral-1200' } },
    });

    expect(() => skin.roles).toThrow(UNREADABLE);
  });
});
