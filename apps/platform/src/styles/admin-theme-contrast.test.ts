import { readFileSync } from 'node:fs';

import { CONTRAST_ROLE, CONTRAST_ROLE_MIN } from '@blog/config';
import { hexToOklch, renderedContrastRatio } from '@blog/utils/color';

const WHITE = 'white';
const TEXT = CONTRAST_ROLE_MIN[CONTRAST_ROLE.TEXT];
const BOUNDARY = CONTRAST_ROLE_MIN[CONTRAST_ROLE.UI_BOUNDARY];
const FOCUS = CONTRAST_ROLE_MIN[CONTRAST_ROLE.FOCUS];

const LIGHT_SELECTOR = ':root {';
const DARK_SELECTOR = ":root[data-theme='dark'] {";
const SYSTEM_DARK_SELECTOR = ":root:not([data-theme='light']) {";

const css = readFileSync(new URL('./admin-theme.css', import.meta.url), 'utf8');

const blockOf = (selector: string) => {
  const start = css.indexOf(selector);
  if (start === -1) throw new Error(`admin-theme.css has no ${selector} block`);

  return css.slice(start + selector.length, css.indexOf('}', start));
};

const declarationsOf = (selector: string) =>
  blockOf(selector)
    .split(';')
    .map((declaration) => declaration.replace(/\s+/g, ''))
    .filter(Boolean);

const hexTokensOf = (selector: string) =>
  new Map(
    [
      ...blockOf(selector).matchAll(
        /--admin-([a-z0-9-]+):\s*(#[0-9a-f]{6});/gi,
      ),
    ].map(([, name, hex]) => [name, hex]),
  );

const lightTokens = hexTokensOf(LIGHT_SELECTOR);
const darkTokens = new Map([...lightTokens, ...hexTokensOf(DARK_SELECTOR)]);

const colourIn =
  (tokens: ReturnType<typeof hexTokensOf>) => (token: string) => {
    if (token === WHITE) return { l: 1, c: 0, h: 0 };
    const hex = tokens.get(token);
    if (!hex) throw new Error(`--admin-${token} has no hex value`);

    return hexToOklch(hex);
  };

const TOKEN = {
  BAD: 'bad',
  BAD_LINE: 'bad-line',
  BAD_WEAK: 'bad-weak',
  BG: 'bg',
  BRAND: 'brand',
  BRAND_HOVER: 'brand-hover',
  BRAND_INK: 'brand-ink',
  BRAND_STRONG: 'brand-strong',
  BRAND_WEAK: 'brand-weak',
  CONTROL_LINE: 'control-line',
  CONTROL_LINE_TINT: 'control-line-tint',
  HOVER: 'hover',
  MUTED: 'muted',
  OK: 'ok',
  OK_WEAK: 'ok-weak',
  ON_BRAND_INK: 'on-brand-ink',
  PILL_NEUTRAL: 'pill-neutral',
  PILL_NEUTRAL_POPOVER: 'pill-neutral-popover',
  POPOVER: 'popover',
  POPOVER_HOVER: 'popover-hover',
  SEGMENT_ON: 'segment-on',
  SIDE: 'side',
  SIDE_ACCENT: 'side-accent',
  SIDE_FIELD_LINE: 'side-field-line',
  SIDE_MUTED: 'side-muted',
  SIDE_RAISED: 'side-raised',
  SIDE_TEXT: 'side-text',
  SURFACE: 'surface',
  SURFACE_2: 'surface-2',
  SURFACE_HEAD: 'surface-head',
  TEXT: 'text',
  TEXT_STRONG: 'text-strong',
  THEME_TRACK: 'theme-track',
  WARN: 'warn',
  WARN_WEAK: 'warn-weak',
} as const;

type TPair = readonly [string, string, string, number];

const PRESSED_RING = 'Pressed ring';

const SHARED_PAIRS: readonly TPair[] = [
  ['Text on card', TOKEN.TEXT, TOKEN.SURFACE, TEXT],
  ['Text on card header', TOKEN.TEXT, TOKEN.SURFACE_HEAD, TEXT],
  ['Muted on card header', TOKEN.MUTED, TOKEN.SURFACE_HEAD, TEXT],
  ['Muted on page', TOKEN.MUTED, TOKEN.BG, TEXT],
  ['Nav text on sidebar', TOKEN.SIDE_TEXT, TOKEN.SIDE, TEXT],
  ['Section label on sidebar', TOKEN.SIDE_MUTED, TOKEN.SIDE, TEXT],
  ['Active row text', TOKEN.TEXT_STRONG, TOKEN.SIDE_RAISED, TEXT],
  ['Link on card', TOKEN.BRAND_INK, TOKEN.SURFACE, TEXT],
  ['Link hover on card', TOKEN.BRAND_STRONG, TOKEN.SURFACE, TEXT],
  ['White on primary', WHITE, TOKEN.BRAND, TEXT],
  ['Live pill', TOKEN.OK, TOKEN.OK_WEAK, TEXT],
  ['Provisioning pill', TOKEN.WARN, TOKEN.WARN_WEAK, TEXT],
  ['Failed pill', TOKEN.BAD, TOKEN.BAD_WEAK, TEXT],
  ['Archived pill', TOKEN.MUTED, TOKEN.PILL_NEUTRAL, TEXT],
  ['Plan pill', TOKEN.BRAND_STRONG, TOKEN.BRAND_WEAK, TEXT],
  ['Input border on card', TOKEN.CONTROL_LINE, TOKEN.SURFACE, BOUNDARY],
  ['Input border on page', TOKEN.CONTROL_LINE, TOKEN.BG, BOUNDARY],
  ['Switch off track on card', TOKEN.CONTROL_LINE, TOKEN.SURFACE, BOUNDARY],
  ['Switch on track on card', TOKEN.BRAND, TOKEN.SURFACE, BOUNDARY],
  ['Switcher border on sidebar', TOKEN.SIDE_FIELD_LINE, TOKEN.SIDE, BOUNDARY],
  [
    'Control on card header',
    TOKEN.CONTROL_LINE_TINT,
    TOKEN.SURFACE_HEAD,
    BOUNDARY,
  ],
  ['2px focus ring on card', TOKEN.BRAND_INK, TOKEN.SURFACE, FOCUS],
  ['Focus ring on open row', TOKEN.BRAND_INK, TOKEN.SURFACE_2, FOCUS],
  ['Focus ring on sidebar', TOKEN.SIDE_ACCENT, TOKEN.SIDE, FOCUS],
  ['Error text on card', TOKEN.BAD, TOKEN.SURFACE, TEXT],
  ['Invalid border on card', TOKEN.BAD_LINE, TOKEN.SURFACE, BOUNDARY],
  ['Text on menu', TOKEN.TEXT, TOKEN.POPOVER, TEXT],
  ['Muted on hovered menu row', TOKEN.MUTED, TOKEN.POPOVER_HOVER, TEXT],
  [
    'Check and focus ring on hovered row',
    TOKEN.BRAND_INK,
    TOKEN.POPOVER_HOVER,
    FOCUS,
  ],
  ['Theme switch border on menu', TOKEN.CONTROL_LINE, TOKEN.POPOVER, BOUNDARY],
  [
    'Name on hovered account trigger',
    TOKEN.TEXT_STRONG,
    TOKEN.SIDE_RAISED,
    TEXT,
  ],
  [
    'Email on hovered account trigger',
    TOKEN.SIDE_MUTED,
    TOKEN.SIDE_RAISED,
    TEXT,
  ],
  ['Muted on menu', TOKEN.MUTED, TOKEN.POPOVER, TEXT],
  ['Row text on highlighted row', TOKEN.TEXT, TOKEN.POPOVER_HOVER, TEXT],
  ['Current bar on menu', TOKEN.BRAND_INK, TOKEN.POPOVER, BOUNDARY],
  [
    'Pinned trigger border on menu',
    TOKEN.SIDE_FIELD_LINE,
    TOKEN.POPOVER,
    BOUNDARY,
  ],
  ['Name on account trigger at rest', TOKEN.TEXT_STRONG, TOKEN.SIDE, TEXT],
  ['Neutral pill in a menu', TOKEN.MUTED, TOKEN.PILL_NEUTRAL_POPOVER, TEXT],
  ['Selected preset tick', TOKEN.ON_BRAND_INK, TOKEN.BRAND_INK, BOUNDARY],
  ['Hovered icon on hover', TOKEN.TEXT, TOKEN.HOVER, BOUNDARY],
  ['Rest icon on toolbar track', TOKEN.MUTED, TOKEN.THEME_TRACK, BOUNDARY],
  ['Rest icon on hover', TOKEN.MUTED, TOKEN.HOVER, BOUNDARY],
  ['Pressed icon on plate', TOKEN.BRAND_STRONG, TOKEN.SEGMENT_ON, BOUNDARY],
  ['Toolbar track border on card', TOKEN.CONTROL_LINE, TOKEN.SURFACE, BOUNDARY],
  ['Solo pressed icon', TOKEN.BRAND_STRONG, TOKEN.BRAND_WEAK, BOUNDARY],
  ['Chip text on chip', TOKEN.TEXT, TOKEN.SURFACE, TEXT],
  ['Chip count on chip', TOKEN.MUTED, TOKEN.SURFACE, TEXT],
  ['Chip text on chip hover', TOKEN.TEXT, TOKEN.SURFACE_2, TEXT],
  ['Chip border on page', TOKEN.CONTROL_LINE, TOKEN.BG, BOUNDARY],
  ['White on active chip', WHITE, TOKEN.BRAND, TEXT],
  ['White on active chip hover', WHITE, TOKEN.BRAND_HOVER, TEXT],
  ['Active chip hover on page', TOKEN.BRAND_HOVER, TOKEN.BG, BOUNDARY],
  ['Error pill on active chip', TOKEN.BAD, TOKEN.SURFACE, TEXT],
  ['Locked text on page', TOKEN.MUTED, TOKEN.BG, TEXT],
  ['Focus ring on toolbar track', TOKEN.BRAND_INK, TOKEN.THEME_TRACK, FOCUS],
  ['Success edge and icon on toast', TOKEN.OK, TOKEN.POPOVER, BOUNDARY],
  ['Warning edge and icon on toast', TOKEN.WARN, TOKEN.POPOVER, BOUNDARY],
  ['Error edge and icon on toast', TOKEN.BAD, TOKEN.POPOVER, BOUNDARY],
];

const LIGHT_PAIRS: readonly TPair[] = [
  ...SHARED_PAIRS,
  [PRESSED_RING, TOKEN.BRAND_INK, TOKEN.THEME_TRACK, BOUNDARY],
];

const DARK_PAIRS: readonly TPair[] = [
  ...SHARED_PAIRS,
  [PRESSED_RING, TOKEN.BRAND_INK, TOKEN.POPOVER_HOVER, BOUNDARY],
];

describe.each([
  ['light', LIGHT_PAIRS, colourIn(lightTokens)],
  ['dark', DARK_PAIRS, colourIn(darkTokens)],
] as const)('admin %s palette contrast', (_palette, pairs, colourOf) => {
  it.each(pairs)(
    '%s (%s on %s) meets %d:1',
    (_pair, foreground, background, threshold) => {
      const ratio = renderedContrastRatio(colourOf(foreground), [
        colourOf(background),
      ]);

      expect(ratio).toBeGreaterThanOrEqual(threshold);
    },
  );
});

describe('admin dark palette', () => {
  it('applies the same values when the device is dark as when Dark is chosen', () => {
    expect(declarationsOf(SYSTEM_DARK_SELECTOR)).toEqual(
      declarationsOf(DARK_SELECTOR),
    );
  });
});
