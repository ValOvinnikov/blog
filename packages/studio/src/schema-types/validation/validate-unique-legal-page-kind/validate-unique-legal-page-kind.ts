import type { TMaybeUndefined } from '@blog/config';
import { LEGAL_PAGE_KIND, isLocaleIsoCode } from '@blog/config/constants';
import { LANGUAGE_FIELD } from '@blog/studio/schema-types/fields/language-field/language-field';
import { LOCALE_LABEL } from '@blog/studio/schema-types/inputs/localization-notice-input/missing-locales';
import { getDefaultLanguage } from '@blog/studio/schema-types/validation/default-language/default-language';
import {
  fetchFailSafe,
  getPublishedClient,
} from '@blog/studio/schema-types/validation/get-drafts-client/get-drafts-client';
import { isString, toTitleCase } from '@blog/utils/primitives';
import { getPublishedId, type ValidationContext } from 'sanity';

const FAIL_SAFE_ASSUMES_NO_CONFLICT = false;

export const LEGAL_PAGE_KIND_FIELD = 'kind';

export const validateUniqueLegalPageKind = async (
  value: TMaybeUndefined<string>,
  context: ValidationContext,
): Promise<string | true> => {
  const { document } = context;

  if (!value || value === LEGAL_PAGE_KIND.OTHER || !document) return true;

  const field = document[LANGUAGE_FIELD];
  const defaultLanguage = getDefaultLanguage();
  const language =
    isString(field) && isLocaleIsoCode(field) ? field : defaultLanguage;

  const hasPublishedConflict = await fetchFailSafe<boolean>(
    getPublishedClient(context),
    `defined(*[_type == $type && ${LEGAL_PAGE_KIND_FIELD} == $kind && coalesce(${LANGUAGE_FIELD}, $defaultLanguage) == $language && _id != $id][0]._id)`,
    {
      type: document._type,
      kind: value,
      language,
      defaultLanguage,
      id: getPublishedId(document._id),
    },
    FAIL_SAFE_ASSUMES_NO_CONFLICT,
  );

  return hasPublishedConflict
    ? `There's already a published ${toTitleCase(value)} page in ${LOCALE_LABEL[language]}. Only Other pages can share a kind.`
    : true;
};
