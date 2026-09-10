import type { MigrationContext } from 'sanity/migrate';

const PAGE_TAG_INDEX_TYPE = 'page_tagIndex';
const TAXONOMY_LIST_MODULE_TYPE = 'module_taxonomyList';

export const stripDraftPrefix = (id: string): string =>
  id.replace(/^drafts\./, '');

type TPageTagIndexRefs = {
  taxonomyRef?: string | null;
  moduleRefs?: (string | null)[] | null;
};

/**
 * Keyed by `context` (one stable object per migration run, per `run()` in
 * `@sanity/migrate`) the same way `20260909T2230-fold-page-topic-index-into-modules`
 * caches its id map — a plain module-level variable would leak the first
 * run's result across later runs sharing the same process, and across tests
 * sharing the same module instance.
 */
const referencedIdsCache = new WeakMap<
  MigrationContext,
  Promise<Set<string>>
>();

const fetchReferencedTaxonomyListIds = async (
  context: MigrationContext,
): Promise<Set<string>> => {
  const docs = await context.client.fetch<TPageTagIndexRefs[]>(
    `*[_type == $pageType]{
      "taxonomyRef": taxonomyList._ref,
      "moduleRefs": modules[_type == $moduleType]._ref
    }`,
    { pageType: PAGE_TAG_INDEX_TYPE, moduleType: TAXONOMY_LIST_MODULE_TYPE },
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

export const getReferencedTaxonomyListIds = (
  context: MigrationContext,
): Promise<Set<string>> => {
  const cached = referencedIdsCache.get(context);

  if (cached) return cached;

  const computed = fetchReferencedTaxonomyListIds(context);

  referencedIdsCache.set(context, computed);

  return computed;
};
