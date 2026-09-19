import type { MigrationContext } from 'sanity/migrate';

const TAXONOMY_LIST_MODULE_TYPE = 'module_taxonomyList';

export const stripDraftPrefix = (id: string): string =>
  id.replace(/^drafts\./, '');

type TIndexPageRefs = {
  taxonomyRef?: string | null;
  moduleRefs?: (string | null)[] | null;
};

// Keyed by context then pageType — a plain module-level variable would leak across runs/tests sharing the same module instance.
const referencedIdsCache = new WeakMap<
  MigrationContext,
  Map<string, Promise<Set<string>>>
>();

const fetchReferencedTaxonomyListIds = async (
  context: MigrationContext,
  pageType: string,
): Promise<Set<string>> => {
  const docs = await context.client.fetch<TIndexPageRefs[]>(
    `*[_type == $pageType]{
      "taxonomyRef": taxonomyList._ref,
      "moduleRefs": modules[_type == $moduleType]._ref
    }`,
    { pageType, moduleType: TAXONOMY_LIST_MODULE_TYPE },
  );

  const ids = docs.flatMap((doc) => [
    doc.taxonomyRef,
    ...(doc.moduleRefs ?? []),
  ]);

  return new Set(
    ids
      .filter((ref): ref is string => Boolean(ref))
      .map((ref) => stripDraftPrefix(ref)),
  );
};

/** Every `module_taxonomyList` id referenced (directly or via `modules[]`) by a document of `pageType`, published or draft. */
export const getReferencedTaxonomyListIds = (
  context: MigrationContext,
  pageType: string,
): Promise<Set<string>> => {
  const byPageType = referencedIdsCache.get(context) ?? new Map();

  referencedIdsCache.set(context, byPageType);

  const cached = byPageType.get(pageType);

  if (cached) return cached;

  const computed = fetchReferencedTaxonomyListIds(context, pageType);

  byPageType.set(pageType, computed);

  return computed;
};
