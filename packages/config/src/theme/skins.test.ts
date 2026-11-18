import {
  BRAND_VARIANT,
  COLOR_SCHEME,
  SKIN_MODE,
  type TColorScheme,
} from '@shinefold/config/constants';

import { SCHEME_RAMPS } from './contrast-scheme-ramps';
import {
  AMBIENT,
  AMBIENT_RAISED,
  BRAND_PRIMARY_MUTED,
  SECONDARY,
  TEXT,
  TEXT_MUTED,
} from './contrast-surfaces';
import { PALETTE } from './palette-ramps';
import { effectiveSchemeOf, findSkinFailures } from './skin-contrast';
import {
  BRAND_SCRIMS,
  PAGE_ROLES,
  SKIN_FILL_ROLES,
  type TPaletteStop,
} from './skin-roles';
import {
  defineSkin,
  SKIN_REGISTRY,
  STORYBOOK_SKINS,
  type TSkin,
} from './skins';

const COLOR_SCHEMES = Object.values(COLOR_SCHEME);

const DARKEST_NEUTRAL = '--palette-neutral-2700' satisfies TPaletteStop;

const MID_NEUTRAL = '--palette-neutral-1300' satisfies TPaletteStop;

const MOCK_UNREADABLE_TITLE = 'Unreadable';

const SKIN_CASES = Object.entries({
  ...SKIN_REGISTRY,
  ...STORYBOOK_SKINS,
}).flatMap(([key, skin]) =>
  COLOR_SCHEMES.map((scheme) => ({ key, skin, scheme })),
);

const failuresOf = ({ mode, roles }: TSkin, scheme: TColorScheme) =>
  findSkinFailures(roles[scheme], scheme, effectiveSchemeOf(mode, scheme));

const lightnessAndChromaOf = ({ l, c }: { l: number; c: number }) => ({
  l,
  c,
});

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
        expect(roles[fill]).not.toBe(roles[AMBIENT]);
      }
    },
  );

  it.each(COLOR_SCHEMES)('Plain takes the page roles under %s', (scheme) => {
    expect(SKIN_REGISTRY[BRAND_VARIANT.PRIMARY].roles[scheme]).toEqual(
      PAGE_ROLES[scheme],
    );
  });

  it.each([
    [BRAND_VARIANT.SECONDARY, SECONDARY],
    [BRAND_VARIANT.BRAND_PRIMARY, BRAND_PRIMARY_MUTED],
  ] as const)('%s sits on the page %s', (variant, pageGround) => {
    for (const scheme of COLOR_SCHEMES) {
      const { roles } = SKIN_REGISTRY[variant];

      expect(lightnessAndChromaOf(PALETTE[roles[scheme][AMBIENT]])).toEqual(
        lightnessAndChromaOf(SCHEME_RAMPS[scheme][pageGround]!),
      );
    }
  });

  it.each([BRAND_VARIANT.SECONDARY, BRAND_VARIANT.BRAND_PRIMARY])(
    '%s raises a banner on its own ground',
    (variant) => {
      for (const scheme of COLOR_SCHEMES) {
        const roles = SKIN_REGISTRY[variant].roles[scheme];

        expect(roles[AMBIENT_RAISED]).toBe(roles[AMBIENT]);
      }
    },
  );

  it('dresses the brand ground in the brand scrim', () => {
    const { roles } = SKIN_REGISTRY[BRAND_VARIANT.BRAND_PRIMARY];

    expect(roles[COLOR_SCHEME.LIGHT]).toMatchObject(BRAND_SCRIMS);
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

      expect(skin.roles[scheme][AMBIENT]).toBe(DARKEST_NEUTRAL);
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

  it('throws when a pinned role fails on its ground', () => {
    const skin = defineSkin(MOCK_UNREADABLE_TITLE, {
      ground: {
        [COLOR_SCHEME.LIGHT]: MID_NEUTRAL,
        [COLOR_SCHEME.DARK]: MID_NEUTRAL,
      },
      mode: SKIN_MODE.MATCH,
      pin: { [COLOR_SCHEME.LIGHT]: { [TEXT]: '--palette-neutral-1200' } },
    });

    expect(() => skin.roles).toThrow(MOCK_UNREADABLE_TITLE);
  });
});
