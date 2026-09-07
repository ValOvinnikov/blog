import type { TTaxonomyKind } from '@blog/config/constants';
import { getDraftsClient } from '@blog/studio/schema-types/helpers/get-drafts-client';
import type { ValidationContext } from 'sanity';

type TReference = { _ref?: string } | undefined;

/**
 * Builds a `taxonomyList` reference validator for a topic/tag index page,
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
