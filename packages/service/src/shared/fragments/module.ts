import type { TModuleType } from '@blog/config';
import { q } from '@blog/service/sanity/query';

/**
 * Projects a dereferenced module reference down to its identity (`_id`/`_type`),
 * built against a synthetic input so each page can instantiate `T` with its own
 * document-type union. Stops short of `.project()`: groqd's projection-shape
 * check can't resolve `_type: true` while `T` is still a naked type parameter,
 * so `MODULE_FIELDS_PROJECTION` is applied once `T` is concrete, at each call site.
 */
export function moduleFragmentRoot<T extends TModuleType = TModuleType>() {
  return q.fragment<{ _id: string; _type: T }>();
}

export const MODULE_FIELDS_PROJECTION = { _id: true, _type: true } as const;
