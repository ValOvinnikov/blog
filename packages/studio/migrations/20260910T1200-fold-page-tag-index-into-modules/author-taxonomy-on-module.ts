import { TAXONOMY_KIND } from '@blog/config/constants';
import { at, set, type NodePatch } from 'sanity/migrate';

import { stripDraftPrefix } from './referenced-taxonomy-list-ids';

export type TTaxonomyListModuleDoc = {
  _id: string;
  taxonomy?: string | null;
};

export const authorTaxonomyOnModule = (
  doc: TTaxonomyListModuleDoc,
  referencedIds: ReadonlySet<string>,
): NodePatch[] | undefined => {
  if (doc.taxonomy !== undefined && doc.taxonomy !== null) return undefined;
  if (!referencedIds.has(stripDraftPrefix(doc._id))) return undefined;

  return [at('taxonomy', set(TAXONOMY_KIND.TAGS))];
};
