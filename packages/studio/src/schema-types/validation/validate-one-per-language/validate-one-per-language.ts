import type { TMaybeUndefined } from '@blog/config';
import { isLocaleIsoCode } from '@blog/config/constants';
import { LANGUAGE_FIELD } from '@blog/studio/schema-types/fields/language-field/language-field';
import { LOCALE_LABEL } from '@blog/studio/schema-types/inputs/localization-notice-input/missing-locales';
import { getDefaultLanguage } from '@blog/studio/schema-types/validation/default-language/default-language';
import {
  fetchFailSafe,
  getDraftsClient,
} from '@blog/studio/schema-types/validation/get-drafts-client/get-drafts-client';
import { isString } from '@blog/utils/primitives';
import {
  getPublishedId,
  type SanityDocument,
  type ValidationContext,
} from 'sanity';

const FAIL_SAFE_ASSUMES_UNIQUE = true;

export const validateOnePerLanguage = async (
  document: TMaybeUndefined<SanityDocument>,
  context: ValidationContext,
): Promise<true | string> => {
  if (!document) return true;

  const value = document[LANGUAGE_FIELD];
  const defaultLanguage = getDefaultLanguage();
  const language =
    isString(value) && isLocaleIsoCode(value) ? value : defaultLanguage;

  const isUnique = await fetchFailSafe<boolean>(
    getDraftsClient(context),
    `!defined(*[_type == $type && _id != $id && coalesce(${LANGUAGE_FIELD}, $defaultLanguage) == $language][0]._id)`,
    {
      type: document._type,
      id: getPublishedId(document._id),
      language,
      defaultLanguage,
    },
    FAIL_SAFE_ASSUMES_UNIQUE,
  );

  return (
    isUnique ||
    `There's already a ${context.type?.title ?? 'document'} in ${LOCALE_LABEL[language]}.`
  );
};
