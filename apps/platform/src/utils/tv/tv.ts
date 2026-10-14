import { createTV } from 'tailwind-variants';

// Keep these lists in sync with the custom tokens in `theme.css` and `admin-theme.css`, or `tailwind-merge` misclassifies or drops them.
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
  'admin-11',
  'admin-11-5',
  'admin-12',
  'admin-12-5',
  'admin-13',
  'admin-13-5',
  'admin-14',
  'admin-15',
  'admin-16',
  'admin-24',
];

const FONT_FAMILY_TOKENS = ['display', 'body', 'read', 'mono', 'ui', 'admin'];

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
];

const RADIUS_TOKENS = ['admin', 'admin-control'];

const SHADOW_TOKENS = ['admin', 'admin-lg'];

/** Project-configured `tv`. Import this instead of `tv` from `tailwind-variants`. */
export const tv = createTV({
  twMergeConfig: {
    extend: {
      classGroups: {
        'font-size': [{ text: FONT_SIZE_TOKENS }],
        'font-family': [{ font: FONT_FAMILY_TOKENS }],
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
