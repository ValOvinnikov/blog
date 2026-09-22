import { taxonomyListSchema } from '@blog/studio/schema-types/modules/taxonomy-list/taxonomy-list';
import { fetchDraftsFailSafe } from '@blog/studio/schema-types/validation/get-drafts-client/get-drafts-client';
import type { ValidationContext } from 'sanity';

type TModuleReference = { _type?: string; _ref?: string };

/**
 * A `modules[]` validator requiring every referenced `module_taxonomyList`
 * to have an authored `taxonomy` — a page composing modules freely (unlike
 * the tag index page's dedicated slot) has no other way to know which
 * terms the module should list.
 */
export const validateTaxonomyListHasTaxonomy = async (
  modules: TModuleReference[] | undefined,
  context: ValidationContext,
): Promise<string | true> => {
  const ids = (modules ?? [])
    .filter(
      (module) =>
        module._type === taxonomyListSchema.name && Boolean(module._ref),
    )
    .map((module) => module._ref as string);

  if (ids.length === 0) return true;

  const failSafeAssumesEveryCandidateHasATaxonomy = ids.map((id) => ({
    id,
    taxonomy: 'taxonomy present',
  }));

  const candidates = await fetchDraftsFailSafe<
    { id: string; title?: string | null; taxonomy?: string | null }[]
  >(
    context,
    `*[_id in $ids]{ "id": _id, title, taxonomy }`,
    { ids },
    failSafeAssumesEveryCandidateHasATaxonomy,
  );

  const missing = candidates.find((candidate) => !candidate.taxonomy);

  return missing
    ? `Choose whether the '${missing.title ?? 'Untitled'}' module lists topics or tags.`
    : true;
};
