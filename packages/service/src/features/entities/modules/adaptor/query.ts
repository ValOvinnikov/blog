import { q } from '@blog/service/sanity/query/query';
import { z } from 'zod';

// `match` tokenizes on `_`, so `_type match "module_*"` would also accept a type like `blog_module`.
const MODULE_TYPE_FILTER = 'string::startsWith(_type, "module_")';

export const linkIdsReferencingDocumentQuery = q
  .parameters<{ documentId: string }>()
  .star.filterByType('link')
  .filterRaw('references($documentId)')
  .field('_id');

/** Every module reaching `$documentId` — directly, or through the `link` documents in `$linkIds`. */
export const referencingModuleIdsQuery = q
  .parameters<{ documentId: string; linkIds: string[] }>()
  .star.filterRaw(MODULE_TYPE_FILTER)
  .filterRaw('references($documentId) || references($linkIds)')
  .raw('._id', z.array(z.string()));
