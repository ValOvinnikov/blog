import { readFileSync } from 'node:fs';

import { CONTRAST_ROLE, CONTRAST_ROLE_MIN } from '@blog/config';
import { hexToOklch, renderedContrastRatio } from '@blog/utils/color';

const TEXT = CONTRAST_ROLE_MIN[CONTRAST_ROLE.TEXT];
const BOUNDARY = CONTRAST_ROLE_MIN[CONTRAST_ROLE.UI_BOUNDARY];
const FOCUS = CONTRAST_ROLE_MIN[CONTRAST_ROLE.FOCUS];

const LIGHT_SELECTOR = ':root {';
const DARK_SELECTOR = ":root[data-theme='dark'] {";
const SYSTEM_DARK_SELECTOR = ":root:not([data-theme='light']) {";

const css = readFileSync(
  new URL('./platform-theme.css', import.meta.url),
  'utf8',
);

const blockOf = (selector: string) => {
  const start = css.indexOf(selector);
  if (start === -1)
    throw new Error(`platform-theme.css has no ${selector} block`);

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
        /--(platform-[a-z0-9-]+):\s*(#[0-9a-f]{6}|var\(--platform-[a-z0-9-]+\));/gi,
      ),
    ].map(([, name, hex]) => [name, hex]),
  );

const lightTokens = hexTokensOf(LIGHT_SELECTOR);
const darkTokens = new Map([...lightTokens, ...hexTokensOf(DARK_SELECTOR)]);

const ALIAS = /^var\(--(platform-[a-z0-9-]+)\)$/;

const hexOf = (
  tokens: ReturnType<typeof hexTokensOf>,
  token: string,
): string => {
  const value = tokens.get(token);
  if (!value) throw new Error(`--${token} has no hex value`);
  const alias = ALIAS.exec(value)?.[1];

  return alias ? hexOf(tokens, alias) : value;
};

const colourIn = (tokens: ReturnType<typeof hexTokensOf>) => (token: string) =>
  hexToOklch(hexOf(tokens, token));

const TOKEN = {
  BAD: 'platform-bad',
  BAD_LINE: 'platform-bad-line',
  BAD_WEAK: 'platform-bad-weak',
  BG: 'platform-bg',
  BRAND: 'platform-brand',
  BRAND_HOVER: 'platform-brand-hover',
  BRAND_INK: 'platform-brand-ink',
  BRAND_STRONG: 'platform-brand-strong',
  BRAND_WEAK: 'platform-brand-weak',
  CONTROL_LINE: 'platform-control-line',
  CONTROL_LINE_TINT: 'platform-control-line-tint',
  FOLLOW_MARK: 'platform-follow-mark',
  FOLLOW_MARK_INK: 'platform-follow-mark-ink',
  GLYPH_ACCENT: 'platform-glyph-accent',
  GLYPH_FILL: 'platform-glyph-fill',
  GLYPH_LINE_SOFT: 'platform-glyph-line-soft',
  GLYPH_RAISED: 'platform-glyph-raised',
  HOVER: 'platform-hover',
  MUTED: 'platform-muted',
  OK: 'platform-ok',
  OK_WEAK: 'platform-ok-weak',
  ON_BRAND_INK: 'platform-on-brand-ink',
  ON_SELECTED: 'platform-on-selected',
  PILL_NEUTRAL: 'platform-pill-neutral',
  PILL_NEUTRAL_POPOVER: 'platform-pill-neutral-popover',
  POPOVER: 'platform-popover',
  POPOVER_HOVER: 'platform-popover-hover',
  SEGMENT_ON: 'platform-segment-on',
  SELECTED: 'platform-selected',
  SELECTED_HOVER: 'platform-selected-hover',
  SIDE: 'platform-side',
  SIDE_ACCENT: 'platform-side-accent',
  SIDE_FIELD_LINE: 'platform-side-field-line',
  SIDE_MUTED: 'platform-side-muted',
  SIDE_RAISED: 'platform-side-raised',
  SIDE_TEXT: 'platform-side-text',
  SPINNER_ON_BRAND_LINE: 'platform-spinner-on-brand-line',
  SPINNER_ON_BRAND_LIT: 'platform-spinner-on-brand-lit',
  SURFACE: 'platform-surface',
  SURFACE_2: 'platform-surface-2',
  SURFACE_HEAD: 'platform-surface-head',
  SWITCH_THUMB_ON: 'platform-switch-thumb-on',
  TEXT: 'platform-text',
  TEXT_STRONG: 'platform-text-strong',
  THEME_TRACK: 'platform-theme-track',
  WARN: 'platform-warn',
  WARN_WEAK: 'platform-warn-weak',
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
  ['Active row text', TOKEN.BRAND_INK, TOKEN.SIDE_RAISED, TEXT],
  ['Active row bar', TOKEN.SIDE_ACCENT, TOKEN.SIDE_RAISED, BOUNDARY],
  ['Link on card', TOKEN.BRAND_INK, TOKEN.SURFACE, TEXT],
  ['Link hover on card', TOKEN.BRAND_STRONG, TOKEN.SURFACE, TEXT],
  ['Label on primary', TOKEN.ON_BRAND_INK, TOKEN.BRAND, TEXT],
  ['Live pill', TOKEN.OK, TOKEN.OK_WEAK, TEXT],
  ['Provisioning pill', TOKEN.WARN, TOKEN.WARN_WEAK, TEXT],
  ['Failed pill', TOKEN.BAD, TOKEN.BAD_WEAK, TEXT],
  ['Archived pill', TOKEN.MUTED, TOKEN.PILL_NEUTRAL, TEXT],
  ['Plan pill', TOKEN.BRAND_STRONG, TOKEN.BRAND_WEAK, TEXT],
  ['Input border on card', TOKEN.CONTROL_LINE, TOKEN.SURFACE, BOUNDARY],
  ['Input border on page', TOKEN.CONTROL_LINE, TOKEN.BG, BOUNDARY],
  ['Switch off track on card', TOKEN.CONTROL_LINE, TOKEN.SURFACE, BOUNDARY],
  ['Switch on track on card', TOKEN.BRAND, TOKEN.SURFACE, BOUNDARY],
  ['Switch on thumb on track', TOKEN.SWITCH_THUMB_ON, TOKEN.BRAND, BOUNDARY],
  [
    'Focused field border against resting border',
    TOKEN.BRAND_INK,
    TOKEN.CONTROL_LINE,
    FOCUS,
  ],
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
  ['Label on selected chip', TOKEN.ON_SELECTED, TOKEN.SELECTED, TEXT],
  [
    'Label on selected chip hover',
    TOKEN.ON_SELECTED,
    TOKEN.SELECTED_HOVER,
    TEXT,
  ],
  ['Follow mark tag label', TOKEN.FOLLOW_MARK_INK, TOKEN.FOLLOW_MARK, TEXT],
  [
    'Follow mark edge on its outline',
    TOKEN.FOLLOW_MARK_INK,
    TOKEN.FOLLOW_MARK,
    BOUNDARY,
  ],
  ['Running step number', TOKEN.ON_BRAND_INK, TOKEN.WARN, TEXT],
  [
    'Spinner lit half on primary',
    TOKEN.SPINNER_ON_BRAND_LIT,
    TOKEN.BRAND,
    BOUNDARY,
  ],
  [
    'Spinner unlit half on primary',
    TOKEN.SPINNER_ON_BRAND_LINE,
    TOKEN.BRAND,
    BOUNDARY,
  ],
  ['Selected chip border on page', TOKEN.BRAND, TOKEN.BG, BOUNDARY],
  ['Selected chip hover border on page', TOKEN.BRAND_HOVER, TOKEN.BG, BOUNDARY],
  ['Error pill on active chip', TOKEN.BAD, TOKEN.SURFACE, TEXT],
  ['Locked text on page', TOKEN.MUTED, TOKEN.BG, TEXT],
  ['Focus ring on toolbar track', TOKEN.BRAND_INK, TOKEN.THEME_TRACK, FOCUS],
  ['Success edge and icon on toast', TOKEN.OK, TOKEN.POPOVER, BOUNDARY],
  ['Warning edge and icon on toast', TOKEN.WARN, TOKEN.POPOVER, BOUNDARY],
  ['Error edge and icon on toast', TOKEN.BAD, TOKEN.POPOVER, BOUNDARY],
  [
    'Card style accent bar on tile',
    TOKEN.GLYPH_ACCENT,
    TOKEN.SURFACE,
    BOUNDARY,
  ],
  ['Card style text line on fill', TOKEN.MUTED, TOKEN.GLYPH_FILL, BOUNDARY],
  [
    'Card style short line on fill',
    TOKEN.GLYPH_LINE_SOFT,
    TOKEN.GLYPH_FILL,
    BOUNDARY,
  ],
  [
    'Card style short line on tile',
    TOKEN.GLYPH_LINE_SOFT,
    TOKEN.SURFACE,
    BOUNDARY,
  ],
  [
    'Card style short line on raised card',
    TOKEN.GLYPH_LINE_SOFT,
    TOKEN.GLYPH_RAISED,
    BOUNDARY,
  ],
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
] as const)('platform %s palette contrast', (_palette, pairs, colourOf) => {
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

describe('platform dark palette', () => {
  it('applies the same values when the device is dark as when Dark is chosen', () => {
    expect(declarationsOf(SYSTEM_DARK_SELECTOR)).toEqual(
      declarationsOf(DARK_SELECTOR),
    );
  });
});
