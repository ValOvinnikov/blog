import { CONTRAST_ROLE, type TContrastRole } from '@blog/config/constants';

export type TThemeToken = `--${string}`;

export type TContrastPair = {
  foreground: TThemeToken;
  surfaces: readonly TThemeToken[];
  role: TContrastRole;
  followsAccentHue: boolean;
};

const BANDS = [
  '--primary',
  '--primary-subtle',
  '--secondary',
  '--surface',
  '--surface-2',
  '--brand-primary-muted',
] as const satisfies readonly TThemeToken[];

const TEXT_SURFACES = [
  ...BANDS,
  '--error-muted',
] as const satisfies readonly TThemeToken[];

const FIELD_SURFACES = [
  '--primary',
  '--primary-subtle',
  '--surface',
] as const satisfies readonly TThemeToken[];

const IMAGE_SCRIMS = [
  '--scrim-brand-strong',
  '--scrim-brand-mid',
  '--scrim-brand-weak',
  '--scrim-neutral-strong',
  '--scrim-neutral-mid',
  '--scrim-neutral-weak',
] as const satisfies readonly TThemeToken[];

const CODE_SURFACES = [
  '--surface-2',
  '--brand-primary-muted',
] as const satisfies readonly TThemeToken[];

export const CONTRAST_PAIRS = {
  TEXT: {
    foreground: '--text',
    surfaces: TEXT_SURFACES,
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  TEXT_MUTED: {
    foreground: '--text-muted',
    surfaces: TEXT_SURFACES,
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  TEXT_SUBTLE: {
    foreground: '--text-subtle',
    surfaces: TEXT_SURFACES,
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  BRAND_PRIMARY: {
    foreground: '--brand-primary',
    surfaces: BANDS,
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  BRAND_PRIMARY_HOVER: {
    foreground: '--brand-primary-hover',
    surfaces: BANDS,
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  BRAND_PRIMARY_CONTRAST: {
    foreground: '--brand-primary-contrast',
    surfaces: ['--brand-primary-solid', '--brand-primary-solid-hover'],
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  SUCCESS: {
    foreground: '--success',
    surfaces: ['--success-muted'],
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: false,
  },
  WARN: {
    foreground: '--warn',
    surfaces: ['--warn-muted'],
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: false,
  },
  ERROR: {
    foreground: '--error',
    surfaces: ['--error-muted'],
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: false,
  },
  BORDER_STRONG: {
    foreground: '--border-strong',
    surfaces: FIELD_SURFACES,
    role: CONTRAST_ROLE.UI_BOUNDARY,
    followsAccentHue: false,
  },
  BORDER_EMPHASIS: {
    foreground: '--border-emphasis',
    surfaces: FIELD_SURFACES,
    role: CONTRAST_ROLE.UI_BOUNDARY,
    followsAccentHue: false,
  },
  ON_IMAGE: {
    foreground: '--on-image',
    surfaces: IMAGE_SCRIMS,
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  ON_IMAGE_MUTED: {
    foreground: '--on-image-muted',
    surfaces: IMAGE_SCRIMS,
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  RING: {
    foreground: '--ring',
    surfaces: BANDS,
    role: CONTRAST_ROLE.FOCUS,
    followsAccentHue: true,
  },
  INFO: {
    foreground: '--info',
    surfaces: BANDS,
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  ITEM_ACCENT: {
    foreground: '--item-accent-color',
    surfaces: ['--primary', '--primary-subtle', '--secondary', '--surface'],
    role: CONTRAST_ROLE.DECORATIVE,
    followsAccentHue: true,
  },
  SELECTION: {
    foreground: '--brand-primary',
    surfaces: ['--brand-primary-muted'],
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  CODE_FG: {
    foreground: '--code-fg',
    surfaces: CODE_SURFACES,
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  CODE_COMMENT: {
    foreground: '--code-comment',
    surfaces: CODE_SURFACES,
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  CODE_KEYWORD: {
    foreground: '--code-keyword',
    surfaces: CODE_SURFACES,
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  CODE_PROPERTY: {
    foreground: '--code-property',
    surfaces: CODE_SURFACES,
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  CODE_STRING: {
    foreground: '--code-string',
    surfaces: CODE_SURFACES,
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  CODE_VARIABLE: {
    foreground: '--code-variable',
    surfaces: CODE_SURFACES,
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  CODE_CONSTANT: {
    foreground: '--code-constant',
    surfaces: CODE_SURFACES,
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  CODE_URL: {
    foreground: '--code-url',
    surfaces: CODE_SURFACES,
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
} as const satisfies Record<string, TContrastPair>;

export type TContrastPairId = keyof typeof CONTRAST_PAIRS;
