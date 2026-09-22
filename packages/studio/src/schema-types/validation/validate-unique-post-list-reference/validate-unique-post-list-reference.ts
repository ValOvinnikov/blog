import { fetchDraftsFailSafe } from '@blog/studio/schema-types/validation/get-drafts-client/get-drafts-client';
import { getPostListModuleRefs } from '@blog/studio/schema-types/validation/validate-post-list-cardinality/validate-post-list-cardinality';
import type { SanityDocument, ValidationContext } from 'sanity';

const FAIL_SAFE_ASSUMES_NO_CONFLICT = 0;

/**
 * Builds a document-level rule rejecting a second page of `pageType`
 * referencing an already-used `module_postList` — a page that reads posts
 * back out of a post list correlates it to a single owning page, which
 * would pick an arbitrary owner if two pages shared one list.
 */
export const validateUniquePostListReference =
  (pageType: string, uniquenessError: string) =>
  async (
    document: SanityDocument | undefined,
    context: ValidationContext,
  ): Promise<string | true> => {
    const postListRef = getPostListModuleRefs(document)[0];

    if (!postListRef) return true;

    const publishedId = document?._id.replace(/^drafts\./, '');

    if (!publishedId) return true;

    const conflictingCount = await fetchDraftsFailSafe<number>(
      context,
      `count(*[_type == $type && $postListId in modules[]._ref && !(_id in [$publishedId, "drafts." + $publishedId])])`,
      { type: pageType, postListId: postListRef, publishedId },
      FAIL_SAFE_ASSUMES_NO_CONFLICT,
    );

    return conflictingCount > 0 ? uniquenessError : true;
  };
