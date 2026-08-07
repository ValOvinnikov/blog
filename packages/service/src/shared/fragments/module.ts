import type { TModuleType } from '@blog/config';
import { q } from '@blog/service/sanity/query';

/**
 * Projects a dereferenced module reference down to its identity (`_id`/`_type`).
 * page_home's `modules[]` (postList|cta), page_generic's `modules[]`
 * (content|cta), and page_blog's `modules[]` (postList|cta|newsletter) each
 * deref to a different document-type union, so this is built against a
 * synthetic input via `q.fragment` rather than a single module type — it
 * only touches the two fields every module document shares, so it
 * structurally matches any of those unions at each call site.
 */
export const moduleFragment = q
  .fragment<{ _id: string; _type: TModuleType }>()
  .project({
    _id: true,
    _type: true,
  });
