import { BRAND_VARIANT, COLOR_SCHEME } from '@shinefold/config/constants';
import {
  readCssBlock,
  readRepoFile,
} from '@shinefold/config/testing/theme-css';
import type { TMaybeUndefined } from '@shinefold/config/types';

import { deriveButtonColors } from './button-colors';
import {
  findFaintButtonGrounds,
  formatButtonStyleBlock,
} from './button-grounds';
import { formatSkinCss } from './skin-css';

const MOCK_ACCENT_HUE = 65;
const WHITE = '#ffffff';
const BLACK = '#000000';
const MOCK_DARK_GREY = '#1a1a1a';
const MOCK_YELLOW = '#ffd400';
const MOCK_DARK_GROUND_PINK = '#ff7ab8';

const BUTTON_TO_ACCENT_ROLES = [
  ['--button-fill', '--brand-primary-solid'],
  ['--button-fill-hover', '--brand-primary-solid-hover'],
  ['--button-label', '--brand-primary-contrast'],
];

const ON_LIGHT = {
  '--button-fill': 'var(--button-fill-on-light)',
  '--button-fill-hover': 'var(--button-fill-hover-on-light)',
  '--button-label': 'var(--button-label-on-light)',
};

const ON_DARK = {
  '--button-fill': 'var(--button-fill-on-dark)',
  '--button-fill-hover': 'var(--button-fill-hover-on-dark)',
  '--button-label': 'var(--button-label-on-dark)',
};

const declarationsOf = (block: string): Record<string, string> =>
  Object.fromEntries(
    [...block.matchAll(/(--[\w-]+): ([^;]+);/g)].map(([, property, value]) => [
      property,
      value,
    ]),
  );

const declarationsBySelector = (css: string) =>
  [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].reduce<
    Record<string, Record<string, string>>
  >((bySelector, [, selectors, block]) => {
    for (const selector of selectors!.split(',')) {
      const key = selector.trim();
      bySelector[key] = { ...bySelector[key], ...declarationsOf(block!) };
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

const THEME_CSS = readRepoFile('configs/tailwind/theme.css');

const DEFAULT_SCOPES = [
  ['the page', THEME_CSS, ':root'],
  ['the dark page', THEME_CSS, '.dark'],
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
      const declarations = declarationsOf(readCssBlock(css!, selector!));
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
    color: MOCK_YELLOW,
    darkGroundColor: MOCK_DARK_GROUND_PINK,
  });
  const bySelector = declarationsBySelector(formatButtonStyleBlock(colors));

  it('declares each ground set as literal colours on the page root', () => {
    expect(bySelector[':root']).toMatchObject({
      '--button-fill-on-light': MOCK_YELLOW,
      '--button-fill-on-dark': MOCK_DARK_GROUND_PINK,
      '--button-label-on-light': colors[COLOR_SCHEME.LIGHT].label,
      '--button-fill-hover-on-dark': colors[COLOR_SCHEME.DARK].fillHover,
    });
  });

  it.each([
    [':root', ON_LIGHT],
    ['.dark', ON_DARK],
    ["[data-skin='PRIMARY']", ON_LIGHT],
    [".dark [data-skin='PRIMARY']", ON_DARK],
    ["[data-skin='BRAND_PRIMARY']", ON_LIGHT],
    ["[data-skin='INK']", ON_DARK],
    [".dark [data-skin='INK']", ON_DARK],
  ])('points %s at its ground set', (selector, expected) => {
    expect(bySelector[selector]).toMatchObject(expected);
  });
});

describe(findFaintButtonGrounds, () => {
  it('names the light grounds a white fill fades into', () => {
    expect(
      findFaintButtonGrounds(
        deriveButtonColors({ color: WHITE }),
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
        deriveButtonColors({ color: BLACK, darkGroundColor: MOCK_DARK_GREY }),
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
        deriveButtonColors({ color: BLACK }),
        MOCK_ACCENT_HUE,
      ),
    ).toEqual([]);
  });
});
