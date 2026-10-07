import { CONTENT_ALIGNMENT } from '@blog/config/constants';
import { at, defineMigration, type NodePatch, set } from 'sanity/migrate';

const LEFT_CENTER_MODULE_TYPES = [
  'module_sectionPages',
  'module_featureHighlights',
  'module_newsletter',
  'module_postFeatured',
  'module_postLatest',
  'module_postList',
  'module_postRelated',
  'module_pricing',
  'module_stats',
  'module_taxonomyList',
];

const CTA_TYPE = 'module_cta';
const CTA_LAYOUT_TYPE = 'ctaLayout';

type TModuleDocument = {
  _type: string;
  contentAlignment?: unknown;
  layout?: { _type?: unknown };
};

export const toOperations = (doc: TModuleDocument): NodePatch[] => {
  if (doc._type === CTA_TYPE) {
    return doc.layout && doc.layout._type !== CTA_LAYOUT_TYPE
      ? [at(['layout', '_type'], set(CTA_LAYOUT_TYPE))]
      : [];
  }

  return doc.contentAlignment === CONTENT_ALIGNMENT.RIGHT
    ? [at('contentAlignment', set(CONTENT_ALIGNMENT.CENTER))]
    : [];
};

export default defineMigration({
  title:
    'Move Right content alignment to Center on grid and list modules, and type CTA layouts as ctaLayout',
  documentTypes: [...LEFT_CENTER_MODULE_TYPES, CTA_TYPE],
  migrate: {
    document(rawDoc) {
      return toOperations(rawDoc as unknown as TModuleDocument);
    },
  },
});
