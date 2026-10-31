import { readFileSync } from 'node:fs';

import { CONTRAST_ROLE, CONTRAST_ROLE_MIN } from '@blog/config';
import { hexToOklch, renderedContrastRatio } from '@blog/utils/color';

const WHITE = 'white';
const TEXT = CONTRAST_ROLE_MIN[CONTRAST_ROLE.TEXT];
const BOUNDARY = CONTRAST_ROLE_MIN[CONTRAST_ROLE.UI_BOUNDARY];
const FOCUS = CONTRAST_ROLE_MIN[CONTRAST_ROLE.FOCUS];

const css = readFileSync(new URL('./admin-theme.css', import.meta.url), 'utf8');
const lightBlock = css.slice(css.indexOf(':root {'), css.indexOf('}'));
const lightTokens = new Map(
  [...lightBlock.matchAll(/--admin-([a-z0-9-]+):\s*(#[0-9a-f]{6});/gi)].map(
    ([, name, hex]) => [name, hex],
  ),
);

const colourOf = (token: string) => {
  if (token === WHITE) return { l: 1, c: 0, h: 0 };
  const hex = lightTokens.get(token);
  if (!hex) throw new Error(`--admin-${token} has no light hex value`);

  return hexToOklch(hex);
};

const TOKEN = {
  BAD: 'bad',
  BAD_LINE: 'bad-line',
  BAD_WEAK: 'bad-weak',
  BG: 'bg',
  BRAND: 'brand',
  BRAND_INK: 'brand-ink',
  BRAND_STRONG: 'brand-strong',
  BRAND_WEAK: 'brand-weak',
  CONTROL_LINE: 'control-line',
  CONTROL_LINE_TINT: 'control-line-tint',
  MUTED: 'muted',
  OK: 'ok',
  OK_WEAK: 'ok-weak',
  PILL_NEUTRAL: 'pill-neutral',
  PILL_NEUTRAL_POPOVER: 'pill-neutral-popover',
  POPOVER: 'popover',
  POPOVER_HOVER: 'popover-hover',
  SIDE: 'side',
  SIDE_ACCENT: 'side-accent',
  SIDE_FIELD_LINE: 'side-field-line',
  SIDE_MUTED: 'side-muted',
  SIDE_RAISED: 'side-raised',
  SIDE_TEXT: 'side-text',
  SURFACE: 'surface',
  SURFACE_HEAD: 'surface-head',
  TEXT: 'text',
  TEXT_STRONG: 'text-strong',
  TOOLTIP: 'tooltip',
  WARN: 'warn',
  WARN_ON_DARK: 'warn-on-dark',
  WARN_WEAK: 'warn-weak',
} as const;

const LIGHT_PAIRS: readonly [string, string, string, number][] = [
  ['Text on card', TOKEN.TEXT, TOKEN.SURFACE, TEXT],
  ['Text on card header', TOKEN.TEXT, TOKEN.SURFACE_HEAD, TEXT],
  ['Muted on card header', TOKEN.MUTED, TOKEN.SURFACE_HEAD, TEXT],
  ['Muted on page', TOKEN.MUTED, TOKEN.BG, TEXT],
  ['Nav text on sidebar', TOKEN.SIDE_TEXT, TOKEN.SIDE, TEXT],
  ['Section label on sidebar', TOKEN.SIDE_MUTED, TOKEN.SIDE, TEXT],
  ['Active row text', TOKEN.TEXT_STRONG, TOKEN.SIDE_RAISED, TEXT],
  ['Link on card', TOKEN.BRAND_INK, TOKEN.SURFACE, TEXT],
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
  ['Focus ring on sidebar', TOKEN.SIDE_ACCENT, TOKEN.SIDE, FOCUS],
  ['Error text on card', TOKEN.BAD, TOKEN.SURFACE, TEXT],
  ['Invalid border on card', TOKEN.BAD_LINE, TOKEN.SURFACE, BOUNDARY],
  ['Warn on dark chip', TOKEN.WARN_ON_DARK, TOKEN.TOOLTIP, TEXT],
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
];

describe('admin light palette contrast', () => {
  it.each(LIGHT_PAIRS)(
    '%s (%s on %s) meets %d:1',
    (_pair, foreground, background, threshold) => {
      const ratio = renderedContrastRatio(colourOf(foreground), [
        colourOf(background),
      ]);

      expect(ratio).toBeGreaterThanOrEqual(threshold);
    },
  );
});
