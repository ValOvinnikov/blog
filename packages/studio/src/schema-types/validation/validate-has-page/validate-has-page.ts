import { fetchDraftsFailSafe } from '@blog/studio/schema-types/validation/get-drafts-client/get-drafts-client';
import type { SanityDocument, ValidationContext } from 'sanity';

const FAIL_SAFE_ASSUMES_REFERENCED = 1;

/**
 * Builds a document-level rule rejecting a taxonomy term with no page
 * rendering it yet — the page's URL 404s with no runtime fallback in that
 * state, so publishing is blocked until a page references the term.
 */
export const validateHasPage =
  (pageType: string, referenceField: string, noPageError: string) =>
  async (
    document: SanityDocument | undefined,
    context: ValidationContext,
  ): Promise<string | true> => {
    const publishedId = document?._id.replace(/^drafts\./, '');

    if (!publishedId) return true;

    const referencingCount = await fetchDraftsFailSafe<number>(
      context,
      `count(*[_type == $type && ${referenceField}._ref == $id])`,
      { type: pageType, id: publishedId },
      FAIL_SAFE_ASSUMES_REFERENCED,
    );

    return referencingCount > 0 ? true : noPageError;
  };
