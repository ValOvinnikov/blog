import type { TMaybeUndefined } from '@shinefold/config/types';
import { mapKeysToRecord } from '@shinefold/utils/primitives';

import {
  BRAND_VARIANT,
  COLOR_SCHEME,
  SKIN_MODE,
  type TBrandVariant,
  type TColorScheme,
  type TSkinMode,
} from '@shinefold/config/constants';

import { effectiveSchemeOf } from './skin-contrast';
import { deriveSkinRoles } from './skin-derive';
import type { TPaletteStop, TSkinRoles } from './skin-roles';

export type TSkin = {
  title: string;
  mode: TSkinMode;
  readonly roles: Record<TColorScheme, TSkinRoles>;
};

type TSkinDefinition = {
  ground: Record<TColorScheme, TPaletteStop>;
  mode: TSkinMode;
  pin?: Partial<Record<TColorScheme, Partial<TSkinRoles>>>;
};

const COLOR_SCHEMES = Object.values(COLOR_SCHEME);

export const defineSkin = (
  title: string,
  { ground, mode, pin = {} }: TSkinDefinition,
): TSkin => {
  let roles: TMaybeUndefined<TSkin['roles']>;

  return {
    title,
    mode,
    // Derived on first read: the search measures every accent hue, too slow for module load.
    get roles() {
      roles ??= mapKeysToRecord(COLOR_SCHEMES, (scheme) =>
        deriveSkinRoles({
          title,
          ground: ground[scheme],
          scheme,
          effectiveScheme: effectiveSchemeOf(mode, scheme),
          pin: pin[scheme] ?? {},
        }),
      );
      return roles;
    },
  };
};

const TINTED_BAND_PIN = {
  [COLOR_SCHEME.LIGHT]: {
    '--divider': '--palette-neutral-700',
    '--field-boundary': '--palette-neutral-1100',
  },
  [COLOR_SCHEME.DARK]: {
    '--divider': '--palette-neutral-1400',
    '--field-boundary': '--palette-neutral-1000',
  },
} as const satisfies TSkinDefinition['pin'];

export const SKIN_REGISTRY = {
  [BRAND_VARIANT.PRIMARY]: defineSkin('Plain', {
    ground: {
      [COLOR_SCHEME.LIGHT]: '--palette-neutral-100',
      [COLOR_SCHEME.DARK]: '--palette-neutral-2600',
    },
    mode: SKIN_MODE.MATCH,
  }),
  [BRAND_VARIANT.SECONDARY]: defineSkin('Shaded', {
    ground: {
      [COLOR_SCHEME.LIGHT]: '--palette-neutral-500',
      [COLOR_SCHEME.DARK]: '--palette-neutral-1800',
    },
    mode: SKIN_MODE.MATCH,
    pin: TINTED_BAND_PIN,
  }),
  [BRAND_VARIANT.BRAND_PRIMARY]: defineSkin('Brand tint', {
    ground: {
      [COLOR_SCHEME.LIGHT]: '--palette-brand-200',
      [COLOR_SCHEME.DARK]: '--palette-brand-1600',
    },
    mode: SKIN_MODE.MATCH,
    pin: TINTED_BAND_PIN,
  }),
} as const satisfies Record<TBrandVariant, TSkin>;

export const STORYBOOK_SKINS = {
  STORYBOOK_INVERSE: defineSkin('Inverse (Storybook)', {
    ground: {
      [COLOR_SCHEME.LIGHT]: '--palette-neutral-2200',
      [COLOR_SCHEME.DARK]: '--palette-neutral-2700',
    },
    mode: SKIN_MODE.INVERSE,
  }),
} as const satisfies Record<string, TSkin>;
