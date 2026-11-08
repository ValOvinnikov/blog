import type { TMaybeNull, TMaybeUndefined } from '@blog/config';
import { POST_SOURCE, type TPostSource } from '@blog/config/constants';
import { LANGUAGE_FIELD } from '@blog/studio/schema-types/fields/language-field/language-field';
import { PUBLISHED_POST_CONDITION } from '@blog/studio/schema-types/filters/published-post';
import { LOCALE_LABEL } from '@blog/studio/schema-types/inputs/localization-notice-input/missing-locales';
import {
  fetchFailSafe,
  getDraftsClient,
} from '@blog/studio/schema-types/validation/get-drafts-client/get-drafts-client';
import { getLiveLanguages } from '@blog/studio/schema-types/validation/live-languages/live-languages';
import { hasArrayGotMultipleItems, hasLength } from '@blog/utils/primitives';
import { getPublishedId, type ValidationContext } from 'sanity';

const POST_LANGUAGES_QUERY = `[*[_id == $id][0].${LANGUAGE_FIELD}] + *[_id in *[_type == "translation.metadata" && references($id)][0].translations[].value._ref && ${PUBLISHED_POST_CONDITION}].${LANGUAGE_FIELD}`;

const joinWithOr = (items: readonly string[]) =>
  hasArrayGotMultipleItems(items)
    ? `${items.slice(0, -1).join(', ')} or ${items.at(-1)}`
    : (items[0] ?? '');

export const validatePinnedPostTranslated = async (
  value: TMaybeUndefined<{ _ref?: string }>,
  context: ValidationContext,
): Promise<string | true> => {
  const parent = context.parent as TMaybeUndefined<{
    postSource?: TPostSource;
  }>;
  const liveLanguages = getLiveLanguages();

  if (
    parent?.postSource !== POST_SOURCE.PINNED ||
    !value?._ref ||
    !hasLength(liveLanguages)
  ) {
    return true;
  }

  const postLanguages = await fetchFailSafe<TMaybeNull<unknown[]>>(
    getDraftsClient(context),
    POST_LANGUAGES_QUERY,
    { id: getPublishedId(value._ref) },
    null,
  );
  if (!postLanguages) return true;

  const missing = liveLanguages
    .filter((language) => !postLanguages.includes(language))
    .map((language) => LOCALE_LABEL[language]);

  return !hasLength(missing)
    ? true
    : `The pinned post has no ${joinWithOr(missing)} version, so this hero won't show on ${joinWithOr(missing)} pages.`;
};
