import { q } from '@blog/service/sanity/query/query';
import { z } from 'zod';

// `match` tokenizes on `_`, so `_type match "module_*"` would also accept a type like `blog_module`.
// groqd's typed filterBy has no function calls
const MODULE_TYPE_FILTER = 'string::startsWith(_type, "module_")';

export const linkIdsReferencingDocumentQuery = q
  .parameters<{ documentId: string }>()
  .star.filterByType('link')
  .filterBy('references($documentId)')
  .field('_id');

/** Every module reaching `$documentId` — directly, or through the `link` documents in `$linkIds`. */
export const referencingModuleIdsQuery = q
  .parameters<{ documentId: string; linkIds: string[] }>()
  .star.filterRaw(MODULE_TYPE_FILTER)
  // groqd's typed filterBy rejects `references` over an array parameter
  .filterRaw('references($documentId) || references($linkIds)')
  .raw('._id', z.array(z.string()));
