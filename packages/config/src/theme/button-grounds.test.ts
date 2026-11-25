import { BRAND_VARIANT, COLOR_SCHEME } from '@shinefold/config/constants';
import {
  MOCK_BLACK_HEX,
  MOCK_PINK_HEX,
  MOCK_WHITE_HEX,
  MOCK_YELLOW_HEX,
} from '@shinefold/config/testing/button-colors';
import {
  readCssBlock,
  readCssDeclarations,
  readThemeCss,
} from '@shinefold/config/testing/theme-css';
import type { TMaybeUndefined } from '@shinefold/config/types';

import { deriveButtonColors } from './button-colors';
import {
  findFaintButtonGrounds,
  formatButtonStyleBlock,
} from './button-grounds';
import {
  BRAND_PRIMARY_CONTRAST,
  BRAND_PRIMARY_SOLID,
  BRAND_PRIMARY_SOLID_HOVER,
  BUTTON_FILL,
  BUTTON_FILL_HOVER,
  BUTTON_LABEL,
} from './contrast-surfaces';
import { formatSkinCss } from './skin-css';

const MOCK_ACCENT_HUE = 65;
const MOCK_DARK_GREY = '#1a1a1a';

const BUTTON_TO_ACCENT_ROLES = [
  [BUTTON_FILL, BRAND_PRIMARY_SOLID],
  [BUTTON_FILL_HOVER, BRAND_PRIMARY_SOLID_HOVER],
  [BUTTON_LABEL, BRAND_PRIMARY_CONTRAST],
];

const MOCK_ON_LIGHT = {
  [BUTTON_FILL]: 'var(--button-fill-on-light)',
  [BUTTON_FILL_HOVER]: 'var(--button-fill-hover-on-light)',
  [BUTTON_LABEL]: 'var(--button-label-on-light)',
};

const MOCK_ON_DARK = {
  [BUTTON_FILL]: 'var(--button-fill-on-dark)',
  [BUTTON_FILL_HOVER]: 'var(--button-fill-hover-on-dark)',
  [BUTTON_LABEL]: 'var(--button-label-on-dark)',
};

const declarationsBySelector = (css: string) =>
  [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].reduce<
    Record<string, Record<string, string>>
  >((bySelector, [, selectors, block]) => {
    for (const selector of selectors!.split(',')) {
      const key = selector.trim();
      bySelector[key] = { ...bySelector[key], ...readCssDeclarations(block!) };
    }
    return bySelector;
  }, {});

const resolveIn = (
  declarations: Record<string, string>,
  property: string,
): TMaybeUndefined<string> => {
  const value = declarations[property];
  const target = value?.match(/^var\((--[\w-]+)\)$/)?.[1];
  return target && declarations[target]
    ? resolveIn(declarations, target)
    : value;
};

const MOCK_THEME_CSS = readThemeCss();

const DEFAULT_SCOPES = [
  ['the page', MOCK_THEME_CSS, ':root'],
  ['the dark page', MOCK_THEME_CSS, '.dark'],
  ...Object.values(BRAND_VARIANT).flatMap((variant) => [
    [`the ${variant} band`, formatSkinCss(), `[data-skin='${variant}']`],
    [
      `the dark ${variant} band`,
      formatSkinCss(),
      `.dark [data-skin='${variant}']`,
    ],
  ]),
];

describe('the button roles with no button colour', () => {
  it.each(DEFAULT_SCOPES)(
    'equal the accent solid roles on %s',
    (_scope, css, selector) => {
      const declarations = readCssDeclarations(readCssBlock(css!, selector!));
      const mismatched = BUTTON_TO_ACCENT_ROLES.filter(
        ([button, accent]) =>
          !declarations[accent!] ||
          resolveIn(declarations, button!) !== declarations[accent!],
      );

      expect(mismatched).toEqual([]);
    },
  );
});

describe(formatButtonStyleBlock, () => {
  const colors = deriveButtonColors({
    color: MOCK_YELLOW_HEX,
    darkGroundColor: MOCK_PINK_HEX,
  });
  const bySelector = declarationsBySelector(formatButtonStyleBlock(colors));

  it('declares each ground set as literal colours on the page root', () => {
    expect(bySelector[':root']).toMatchObject({
      '--button-fill-on-light': MOCK_YELLOW_HEX,
      '--button-fill-on-dark': MOCK_PINK_HEX,
      '--button-label-on-light': colors[COLOR_SCHEME.LIGHT].label,
      '--button-fill-hover-on-dark': colors[COLOR_SCHEME.DARK].fillHover,
    });
  });

  it.each([
    [':root', MOCK_ON_LIGHT],
    ['.dark', MOCK_ON_DARK],
    ["[data-skin='PRIMARY']", MOCK_ON_LIGHT],
    [".dark [data-skin='PRIMARY']", MOCK_ON_DARK],
    ["[data-skin='BRAND_PRIMARY']", MOCK_ON_LIGHT],
    ["[data-skin='INK']", MOCK_ON_DARK],
    [".dark [data-skin='INK']", MOCK_ON_DARK],
  ])('points %s at its ground set', (selector, expected) => {
    expect(bySelector[selector]).toMatchObject(expected);
  });
});

describe(findFaintButtonGrounds, () => {
  it('names the light grounds a white fill fades into', () => {
    expect(
      findFaintButtonGrounds(
        deriveButtonColors({ color: MOCK_WHITE_HEX }),
        MOCK_ACCENT_HUE,
      ),
    ).toEqual([
      { variant: BRAND_VARIANT.PRIMARY, scheme: COLOR_SCHEME.LIGHT },
      { variant: BRAND_VARIANT.SECONDARY, scheme: COLOR_SCHEME.LIGHT },
      { variant: BRAND_VARIANT.BRAND_PRIMARY, scheme: COLOR_SCHEME.LIGHT },
    ]);
  });

  it('names the Ink band in light mode among the dark grounds a dark fill fades into', () => {
    expect(
      findFaintButtonGrounds(
        deriveButtonColors({
          color: MOCK_BLACK_HEX,
          darkGroundColor: MOCK_DARK_GREY,
        }),
        MOCK_ACCENT_HUE,
      ),
    ).toEqual([
      { variant: BRAND_VARIANT.PRIMARY, scheme: COLOR_SCHEME.DARK },
      { variant: BRAND_VARIANT.SECONDARY, scheme: COLOR_SCHEME.DARK },
      { variant: BRAND_VARIANT.BRAND_PRIMARY, scheme: COLOR_SCHEME.DARK },
      { variant: BRAND_VARIANT.INK, scheme: COLOR_SCHEME.LIGHT },
      { variant: BRAND_VARIANT.INK, scheme: COLOR_SCHEME.DARK },
    ]);
  });

  it('names no ground when the fill clears 3:1 on every one', () => {
    expect(
      findFaintButtonGrounds(
        deriveButtonColors({ color: MOCK_BLACK_HEX }),
        MOCK_ACCENT_HUE,
      ),
    ).toEqual([]);
  });
});
