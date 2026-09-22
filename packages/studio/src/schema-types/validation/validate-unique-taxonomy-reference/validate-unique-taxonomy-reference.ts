import { fetchDraftsFailSafe } from '@blog/studio/schema-types/validation/get-drafts-client/get-drafts-client';
import type { ValidationContext } from 'sanity';

type TReferenceValue = { _ref?: string } | undefined;

const FAIL_SAFE_ASSUMES_NO_CONFLICT = 0;

/**
 * Builds a field-level rule rejecting a second page of `pageType` referencing
 * an already-covered taxonomy term — the page's URL is derived from the
 * term, so a second page would make it ambiguous. `perspective: 'drafts'` so
 * an unpublished conflicting page still counts.
 */
export const validateUniqueTaxonomyReference =
  (pageType: string, referenceField: string, uniquenessError: string) =>
  async (
    value: TReferenceValue,
    context: ValidationContext,
  ): Promise<string | true> => {
    if (!value?._ref) return true;

    const publishedId = context.document?._id.replace(/^drafts\./, '');

    if (!publishedId) return true;

    const conflictingCount = await fetchDraftsFailSafe<number>(
      context,
      `count(*[_type == $type && ${referenceField}._ref == $refId && !(_id in [$publishedId, "drafts." + $publishedId])])`,
      { type: pageType, refId: value._ref, publishedId },
      FAIL_SAFE_ASSUMES_NO_CONFLICT,
    );

    return conflictingCount > 0 ? uniquenessError : true;
  };
