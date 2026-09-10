import type { TTaxonomyKind } from '@blog/config/constants';
import { getDraftsClient } from '@blog/studio/schema-types/helpers/get-drafts-client';
import type { SanityDocument, ValidationContext } from 'sanity';

type TReference = { _ref?: string } | undefined;

/**
 * Builds a `taxonomyList` reference validator for a tag index page,
 * rejecting a referenced module whose authored `taxonomy` names the other
 * kind. A module left with no `taxonomy` passes — that's the common case for
 * a dedicated index-page slot, which infers its kind from the page itself.
 */
export const validateTaxonomyListMatchesKind =
  (kind: TTaxonomyKind, mismatchError: string) =>
  async (
    value: TReference,
    context: ValidationContext,
  ): Promise<string | true> => {
    if (!value?._ref) return true;

    const client = getDraftsClient(context);

    const module = await client.fetch<{ taxonomy?: string | null } | null>(
      `*[_id == $id][0]{ taxonomy }`,
      { id: value._ref },
    );

    return module?.taxonomy && module.taxonomy !== kind ? mismatchError : true;
  };

type TModuleReference = { _type?: string; _ref?: string };
type TTaxonomyListReferencesDocument = {
  taxonomyList?: { _ref?: string };
  modules?: TModuleReference[];
};

const collectTaxonomyListRefs = (
  document: SanityDocument | undefined,
  moduleTypeName: string,
): string[] => {
  const doc = document as TTaxonomyListReferencesDocument | undefined;

  const moduleRefs = (doc?.modules ?? [])
    .filter((module) => module._type === moduleTypeName)
    .map((module) => module._ref)
    .filter((ref): ref is string => Boolean(ref));

  const legacyRef = doc?.taxonomyList?._ref;

  return [...new Set(legacyRef ? [legacyRef, ...moduleRefs] : moduleRefs)];
};

/**
 * Document-level counterpart of `validateTaxonomyListMatchesKind`, checking
 * every referenced taxonomy list — the deprecated `taxonomyList` field and
 * any `modules[]` entry of `moduleTypeName` — so a page that authors the
 * reference either way still rejects one set to the other kind.
 */
export const validateTaxonomyListReferencesMatchKind =
  (kind: TTaxonomyKind, moduleTypeName: string, mismatchError: string) =>
  async (
    document: SanityDocument | undefined,
    context: ValidationContext,
  ): Promise<string | true> => {
    const ids = collectTaxonomyListRefs(document, moduleTypeName);

    if (ids.length === 0) return true;

    const client = getDraftsClient(context);

    const modules = await client.fetch<{ taxonomy?: string | null }[]>(
      `*[_id in $ids]{ taxonomy }`,
      { ids },
    );

    return modules.some((module) => module.taxonomy && module.taxonomy !== kind)
      ? mismatchError
      : true;
  };
