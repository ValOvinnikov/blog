import { LANGUAGE_FIELD } from '@blog/studio/schema-types/fields/language-field/language-field';
import { fetchDraftsFailSafe } from '@blog/studio/schema-types/validation/get-drafts-client/get-drafts-client';
import { getPublishedId, type SlugValidationContext } from 'sanity';

const FAIL_SAFE_ASSUMES_UNIQUE = true;

const stringOrEmpty = (value: unknown): string =>
  typeof value === 'string' ? value : '';

const parentIdOf = (parent: unknown): string => {
  const ref =
    parent && typeof parent === 'object' && '_ref' in parent
      ? parent._ref
      : undefined;

  return typeof ref === 'string' ? getPublishedId(ref) : '';
};

export const validateLandingSlugUniqueAmongSiblings = async (
  slug: string,
  context: SlugValidationContext,
): Promise<boolean> => {
  const { document } = context;

  if (!document) return true;

  return fetchDraftsFailSafe<boolean>(
    context,
    `!defined(*[_type == $type && _id != $id && slug.current == $slug && coalesce(${LANGUAGE_FIELD}, "") == $language && coalesce(parent._ref, "") == $parentId][0]._id)`,
    {
      type: document._type,
      id: getPublishedId(document._id),
      slug,
      language: stringOrEmpty(document[LANGUAGE_FIELD]),
      parentId: parentIdOf(document.parent),
    },
    FAIL_SAFE_ASSUMES_UNIQUE,
  );
};
