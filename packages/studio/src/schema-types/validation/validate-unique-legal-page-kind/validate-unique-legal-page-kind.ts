import type { TMaybeUndefined } from '@blog/config';
import { LEGAL_PAGE_KIND, isLocaleIsoCode } from '@blog/config/constants';
import { LANGUAGE_FIELD } from '@blog/studio/schema-types/fields/language-field/language-field';
import { LOCALE_LABEL } from '@blog/studio/schema-types/inputs/localization-notice-input/missing-locales';
import { fetchPublishedFailSafe } from '@blog/studio/schema-types/validation/get-drafts-client/get-drafts-client';
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

  const language = document[LANGUAGE_FIELD];
  const languageCode = isString(language) ? language : '';

  const hasPublishedConflict = await fetchPublishedFailSafe<boolean>(
    context,
    `defined(*[_type == $type && ${LEGAL_PAGE_KIND_FIELD} == $kind && coalesce(${LANGUAGE_FIELD}, "") == $language && _id != $id][0]._id)`,
    {
      type: document._type,
      kind: value,
      language: languageCode,
      id: getPublishedId(document._id),
    },
    FAIL_SAFE_ASSUMES_NO_CONFLICT,
  );

  if (!hasPublishedConflict) return true;

  const languageLabel = isLocaleIsoCode(languageCode)
    ? ` in ${LOCALE_LABEL[languageCode]}`
    : '';

  return `There's already a published ${toTitleCase(value)} page${languageLabel}. Only Other pages can share a kind.`;
};
