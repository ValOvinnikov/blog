import { LANGUAGE_FIELD } from '@blog/studio/schema-types/fields/language-field/language-field';
import {
  fetchFailSafe,
  getDraftsClient,
} from '@blog/studio/schema-types/validation/get-drafts-client/get-drafts-client';
import { isString } from '@blog/utils/primitives';
import { getPublishedId, type SlugValidationContext } from 'sanity';

const FAIL_SAFE_ASSUMES_UNIQUE = true;

export const validateSlugUniqueInLanguage = async (
  slug: string,
  context: SlugValidationContext,
): Promise<boolean> => {
  const { document } = context;

  if (!document) return true;

  const language = document[LANGUAGE_FIELD];

  return fetchFailSafe<boolean>(
    getDraftsClient(context),
    `!defined(*[_type == $type && _id != $id && slug.current == $slug && coalesce(${LANGUAGE_FIELD}, "") == $language][0]._id)`,
    {
      type: document._type,
      id: getPublishedId(document._id),
      slug,
      language: isString(language) ? language : '',
    },
    FAIL_SAFE_ASSUMES_UNIQUE,
  );
};
