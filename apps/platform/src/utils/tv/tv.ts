import { createTV } from 'tailwind-variants';

import { SHADOW_TOKENS } from './shadow-tokens';

const platformTokens = (...suffixes: string[]) =>
  suffixes.map((suffix) => `platform-${suffix}`);

// Keep these lists and `SHADOW_TOKENS` in sync with the custom tokens in `theme.css` and `platform-theme.css`, or `tailwind-merge` misclassifies or drops them.
const FONT_SIZE_TOKENS = [
  'display',
  'hero',
  'title-xl',
  'title-2xl',
  'title-3xl',
  'post-title',
  'prose-h2',
  'prose-h3',
  'prose-h4',
  'prose',
  'lead',
  'caption',
  'copy',
  'card-title',
  'card-copy',
  'meta',
  'label',
  'code',
  ...platformTokens(
    '10-5',
    '11',
    '11-5',
    '12',
    '12-5',
    '13',
    '13-5',
    '14',
    '15',
    '16',
    '20',
    '22',
    '24',
    '28',
  ),
];

const FONT_FAMILY_TOKENS = [
  'display',
  'body',
  'read',
  'mono',
  'ui',
  'platform',
  'platform-mono',
];

const TRACKING_TOKENS = [
  'tight-display',
  'tight-hero',
  'tight-card',
  'label',
  'eyebrow',
  'section',
];

const SPACING_TOKENS = [
  'gutter',
  'section',
  'page-y',
  'site-x',
  'site-y',
  'card-x',
  'card-y',
  'platform-card',
];

const RADIUS_TOKENS = [
  'platform',
  ...platformTokens(
    'control',
    'bar',
    '3',
    '5',
    '8',
    '10',
    '12',
    '14',
    '18',
    '22',
  ),
];

const LEADING_TOKENS = platformTokens('1-4', '1-45', '18', '19', '22');

const FONT_WEIGHT_TOKENS = ['platform-650'];

/** Import this instead of `tv` from `tailwind-variants`. */
export const tv = createTV({
  twMergeConfig: {
    extend: {
      classGroups: {
        'font-size': [{ text: FONT_SIZE_TOKENS }],
        'font-family': [{ font: FONT_FAMILY_TOKENS }],
        'font-weight': [{ font: FONT_WEIGHT_TOKENS }],
        leading: [{ leading: LEADING_TOKENS }],
        tracking: [{ tracking: TRACKING_TOKENS }],
        rounded: [{ rounded: RADIUS_TOKENS }],
        'rounded-t': [{ 'rounded-t': RADIUS_TOKENS }],
        'rounded-b': [{ 'rounded-b': RADIUS_TOKENS }],
        'rounded-br': [{ 'rounded-br': RADIUS_TOKENS }],
        shadow: [{ shadow: SHADOW_TOKENS }],
        p: [{ p: SPACING_TOKENS }],
        px: [{ px: SPACING_TOKENS }],
        py: [{ py: SPACING_TOKENS }],
        pt: [{ pt: SPACING_TOKENS }],
        pr: [{ pr: SPACING_TOKENS }],
        pb: [{ pb: SPACING_TOKENS }],
        pl: [{ pl: SPACING_TOKENS }],
      },
    },
  },
});
