import { hexToOklch, renderedContrastRatio } from '@shinefold/utils/color';
import { keys } from 'remeda';

import {
  COLOR_SCHEME,
  CONTRAST_ROLE,
  CONTRAST_ROLE_MIN,
  type TBrandVariant,
  type TColorScheme,
} from '@shinefold/config/constants';

import type { TButtonColors, TButtonColorsByGround } from './button-colors';
import {
  BUTTON_FILL,
  BUTTON_FILL_HOVER,
  BUTTON_LABEL,
} from './contrast-surfaces';
import {
  formatBlock,
  PAGE_SCHEME_SELECTORS,
  skinSchemeSelector,
} from './css-block';
import { PALETTE } from './palette-ramps';
import { effectiveSchemeOf } from './skin-contrast';
import { SKIN_REGISTRY } from './skins';
import type { TOklchStop } from './theme-declarations';

export type TFaintButtonGround = {
  variant: TBrandVariant;
  scheme: TColorScheme;
};

const COLOR_SCHEMES = Object.values(COLOR_SCHEME);

const BUTTON_ROLE_FIELDS = {
  [BUTTON_FILL]: 'fill',
  [BUTTON_FILL_HOVER]: 'fillHover',
  [BUTTON_LABEL]: 'label',
} as const satisfies Record<`--${string}`, keyof TButtonColors>;

const BUTTON_ROLES = keys(BUTTON_ROLE_FIELDS);

const groundTokenOf = (role: string, ground: TColorScheme): string =>
  `${role}-on-${ground.toLowerCase()}`;

const SKIN_GROUNDS = keys(SKIN_REGISTRY).flatMap((variant) =>
  COLOR_SCHEMES.map((scheme) => ({
    variant,
    scheme,
    ground: effectiveSchemeOf(SKIN_REGISTRY[variant].mode, scheme),
  })),
);

const selectorsOn = (ground: TColorScheme): string[] => [
  PAGE_SCHEME_SELECTORS[ground],
  ...SKIN_GROUNDS.filter((skin) => skin.ground === ground).map(
    ({ variant, scheme }) => skinSchemeSelector(variant, scheme),
  ),
];

export const formatButtonStyleBlock = (colors: TButtonColorsByGround): string =>
  [
    ...formatBlock(
      PAGE_SCHEME_SELECTORS[COLOR_SCHEME.LIGHT],
      COLOR_SCHEMES.flatMap((ground) =>
        BUTTON_ROLES.map(
          (role) =>
            `${groundTokenOf(role, ground)}: ${colors[ground][BUTTON_ROLE_FIELDS[role]]}`,
        ),
      ),
    ),
    ...COLOR_SCHEMES.flatMap((ground) =>
      formatBlock(
        selectorsOn(ground).join(',\n'),
        BUTTON_ROLES.map(
          (role) => `${role}: var(${groundTokenOf(role, ground)})`,
        ),
      ),
    ),
  ].join('\n');

const groundColorOf = (
  variant: TBrandVariant,
  scheme: TColorScheme,
  accentHue: number,
) => {
  const { l, c, h }: TOklchStop =
    PALETTE[SKIN_REGISTRY[variant].ground[scheme]];
  return { l, c, h: h ?? accentHue };
};

export const findFaintButtonGrounds = (
  colors: TButtonColorsByGround,
  accentHue: number,
): TFaintButtonGround[] =>
  SKIN_GROUNDS.filter(
    ({ variant, scheme, ground }) =>
      renderedContrastRatio(hexToOklch(colors[ground].fill), [
        groundColorOf(variant, scheme, accentHue),
      ]) < CONTRAST_ROLE_MIN[CONTRAST_ROLE.UI_BOUNDARY],
  ).map(({ variant, scheme }) => ({ variant, scheme }));
