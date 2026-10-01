import type { TTaxonomyKind } from '@blog/config/constants';
import { fetchDraftsFailSafe } from '@blog/studio/schema-types/validation/get-drafts-client/get-drafts-client';
import type { SanityDocument, ValidationContext } from 'sanity';

type TModuleReference = { _type?: string; _ref?: string; _key?: string };
type TTaxonomyListReferencesDocument = {
  taxonomyList?: { _ref?: string };
  modules?: TModuleReference[];
};
type TPathSegment = string | number | { _key: string };
type TRefLocation = { id: string; path: TPathSegment[] };
type TTaxonomyListModule = { _id?: string; taxonomy?: string | null };

const FAIL_SAFE_ASSUMES_NO_MISMATCH: TTaxonomyListModule[] = [];

const collectTaxonomyListRefLocations = (
  document: SanityDocument | undefined,
  moduleTypeName: string,
): TRefLocation[] => {
  const doc = document as TTaxonomyListReferencesDocument | undefined;

  const moduleLocations = (doc?.modules ?? []).flatMap((module, index) =>
    module._type === moduleTypeName && module._ref
      ? [
          {
            id: module._ref,
            path: ['modules', module._key ? { _key: module._key } : index],
          },
        ]
      : [],
  );

  const legacyRef = doc?.taxonomyList?._ref;

  return legacyRef
    ? [{ id: legacyRef, path: ['taxonomyList'] }, ...moduleLocations]
    : moduleLocations;
};

/**
 * Rejects an index page whose referenced taxonomy list — the deprecated
 * `taxonomyList` field or any `modules[]` entry of `moduleTypeName` — is
 * authored for the other taxonomy kind. Reports on each offending location
 * rather than the document as a whole, so the error lands on the Modules
 * field entry (or the legacy field) that actually mismatches.
 */
export const validateTaxonomyListReferencesMatchKind =
  (kind: TTaxonomyKind, moduleTypeName: string, mismatchError: string) =>
  async (
    document: SanityDocument | undefined,
    context: ValidationContext,
  ): Promise<true | { message: string; path: TPathSegment[] }[]> => {
    const locations = collectTaxonomyListRefLocations(document, moduleTypeName);

    if (locations.length === 0) return true;

    const ids = [...new Set(locations.map((location) => location.id))];

    const modules = await fetchDraftsFailSafe<TTaxonomyListModule[]>(
      context,
      `*[_id in $ids]{ _id, taxonomy }`,
      { ids },
      FAIL_SAFE_ASSUMES_NO_MISMATCH,
    );

    const mismatchedIds = new Set(
      modules
        .filter((module) => module.taxonomy && module.taxonomy !== kind)
        .map((module) => module._id)
        .filter((id): id is string => Boolean(id)),
    );

    const violations = locations
      .filter((location) => mismatchedIds.has(location.id))
      .map((location) => ({ message: mismatchError, path: location.path }));

    return violations.length > 0 ? violations : true;
  };
