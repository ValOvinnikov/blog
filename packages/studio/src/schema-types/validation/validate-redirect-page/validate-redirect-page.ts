import { LANGUAGE_FIELD } from '@blog/studio/schema-types/fields/language-field/language-field';
import { findPublishedPageAtPath } from '@blog/studio/schema-types/queries/published-page-at-path/published-page-at-path';
import { getPublishedClient } from '@blog/studio/schema-types/validation/get-drafts-client/get-drafts-client';
import { getPublishedId, type ValidationContext } from 'sanity';

export const REDIRECT_DESTINATION_UNPUBLISHED_ERROR =
  'No page is published at this address in this language. Publish the page first, or send visitors to an address that exists.';

export const REDIRECT_SOURCE_SHADOWED_WARNING =
  'A page is published at this address, so visitors see that page and this redirect does nothing.';

export const AUTOMATIC_REDIRECT_EDITED_WARNING =
  'This redirect was created automatically when a page moved. Changing it can break old links.';

const hasPublishedPage = async (
  value: string,
  context: ValidationContext,
  onFetchError: boolean,
): Promise<boolean> => {
  const language = context.document?.[LANGUAGE_FIELD];

  if (typeof language !== 'string') return onFetchError;

  try {
    const page = await findPublishedPageAtPath(
      getPublishedClient(context),
      value,
      language,
    );
    return page !== null;
  } catch {
    return onFetchError;
  }
};

export const validateRedirectDestinationPage = async (
  value: string | undefined,
  context: ValidationContext,
): Promise<string | true> =>
  !value || (await hasPublishedPage(value, context, true))
    ? true
    : REDIRECT_DESTINATION_UNPUBLISHED_ERROR;

export const validateRedirectSourcePage = async (
  value: string | undefined,
  context: ValidationContext,
): Promise<string | true> =>
  value && (await hasPublishedPage(value, context, false))
    ? REDIRECT_SOURCE_SHADOWED_WARNING
    : true;

export const validateAutomaticRedirectUnchanged =
  (field: 'source' | 'destination') =>
  async (
    value: string | undefined,
    context: ValidationContext,
  ): Promise<string | true> => {
    const { document } = context;

    if (!document || document.isAutomatic !== true) return true;

    try {
      const published = await getPublishedClient(context).fetch<string | null>(
        `*[_id == $id][0].${field}`,
        { id: getPublishedId(document._id) },
      );

      return !published || published === value
        ? true
        : AUTOMATIC_REDIRECT_EDITED_WARNING;
    } catch {
      return true;
    }
  };
