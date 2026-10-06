import { at, defineMigration, set } from 'sanity/migrate';

const LEGACY_TYPE = 'localizedHeadingBlock';
const TARGET_TYPE = 'moduleHeadingBlock';

export const renameModuleHeadingBlockType = (node: { _type?: unknown }) =>
  node._type === LEGACY_TYPE ? at('_type', set(TARGET_TYPE)) : undefined;

export default defineMigration({
  title: 'Rename localizedHeadingBlock to moduleHeadingBlock',
  documentTypes: [
    'block_feature',
    'module_cta',
    'module_faq',
    'module_featureHighlights',
    'module_featureList',
    'module_heroProfile',
    'module_heroStatement',
    'module_logoWall',
    'module_newsletter',
    'module_postFeatured',
    'module_postLatest',
    'module_postList',
    'module_postRelated',
    'module_pricing',
    'module_stats',
    'module_taxonomyList',
    'module_team',
    'module_testimonial',
    'module_timeline',
  ],
  migrate: {
    object(node) {
      return renameModuleHeadingBlockType(node);
    },
  },
});
