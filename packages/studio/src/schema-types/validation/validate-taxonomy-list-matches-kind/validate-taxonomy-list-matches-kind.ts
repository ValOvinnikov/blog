import type { TTaxonomyKind } from '@blog/config/constants';
import { getDraftsClient } from '@blog/studio/schema-types/validation/get-drafts-client/get-drafts-client';
import type { SanityDocument, ValidationContext } from 'sanity';

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
 * Rejects an index page whose referenced taxonomy list — the deprecated
 * `taxonomyList` field or any `modules[]` entry of `moduleTypeName` — is
 * authored for the other taxonomy kind.
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
