import { LANGUAGE_FIELD } from '@blog/studio/schema-types/fields/language-field/language-field';
import { fetchDraftsFailSafe } from '@blog/studio/schema-types/validation/get-drafts-client/get-drafts-client';
import type { ValidationContext } from 'sanity';

type TReferenceValue = { _ref?: string } | undefined;

const FAIL_SAFE_ASSUMES_NO_CONFLICT = 0;

/** A page's URL is derived from its taxonomy term, so a second page for the same term in the same language would make it ambiguous. */
export const validateUniqueTaxonomyReference =
  (pageType: string, referenceField: string, uniquenessError: string) =>
  async (
    value: TReferenceValue,
    context: ValidationContext,
  ): Promise<string | true> => {
    if (!value?._ref) return true;

    const publishedId = context.document?._id.replace(/^drafts\./, '');

    if (!publishedId) return true;

    const language = context.document?.[LANGUAGE_FIELD];

    const conflictingCount = await fetchDraftsFailSafe<number>(
      context,
      `count(*[_type == $type && ${referenceField}._ref == $refId && coalesce(${LANGUAGE_FIELD}, "") == $language && !(_id in [$publishedId, "drafts." + $publishedId])])`,
      {
        type: pageType,
        refId: value._ref,
        language: typeof language === 'string' ? language : '',
        publishedId,
      },
      FAIL_SAFE_ASSUMES_NO_CONFLICT,
    );

    return conflictingCount > 0 ? uniquenessError : true;
  };
