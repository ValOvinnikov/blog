import { q } from '@blog/service/sanity/query';
import { z } from 'zod';

// `match` tokenizes on `_`, so `_type match "module_*"` would also accept a type like `blog_module`.
const MODULE_TYPE_FILTER = 'string::startsWith(_type, "module_")';

const REFERENCING_FILTER =
  'references($documentId) || references(*[_type == "link" && references($documentId)]._id)';

/** Every module reaching `$documentId` — directly, or through a `link` document's `internalReference`. */
export const referencingModuleIdsQuery = q
  .parameters<{ documentId: string }>()
  .star.filterRaw(MODULE_TYPE_FILTER)
  .filterRaw(REFERENCING_FILTER)
  .raw('._id', z.array(z.string()));
