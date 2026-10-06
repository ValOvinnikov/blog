import { REDIRECT_TYPE } from '@blog/studio/schema-types/documents/redirect/redirect-type';
import { LANGUAGE_FIELD } from '@blog/studio/schema-types/fields/language-field/language-field';
import { fetchDraftsFailSafe } from '@blog/studio/schema-types/validation/get-drafts-client/get-drafts-client';
import { getDraftId, getPublishedId, type ValidationContext } from 'sanity';

type TOtherRedirect = {
  source?: string | null;
  destination?: string | null;
  isPrefix?: boolean | null;
};

export const REDIRECT_DUPLICATE_SOURCE_ERROR =
  'Another redirect already starts from this address — edit that one instead.';

export const REDIRECT_INCOMING_CHAIN_ERROR =
  'Another redirect sends visitors to this address — point that one straight at the new address instead of chaining two redirects.';

export const REDIRECT_OUTGOING_CHAIN_ERROR =
  'This address is itself redirected — send visitors to the final address instead of chaining two redirects.';

const OTHER_REDIRECTS_QUERY = `*[_type == $type && ${LANGUAGE_FIELD} == $language && !(_id in [$id, $draftId])]{ source, destination, isPrefix }`;

const isAtOrBeneath = (path: string, base: string) =>
  path === base || path.startsWith(`${base}/`);

const fetchOtherRedirects = async (
  context: ValidationContext,
): Promise<TOtherRedirect[]> => {
  const { document } = context;
  const language = document?.[LANGUAGE_FIELD];

  if (!document || typeof language !== 'string') return [];

  return fetchDraftsFailSafe<TOtherRedirect[]>(
    context,
    OTHER_REDIRECTS_QUERY,
    {
      type: REDIRECT_TYPE,
      language,
      id: getPublishedId(document._id),
      draftId: getDraftId(document._id),
    },
    [],
  );
};

export const validateRedirectSource = async (
  value: string | undefined,
  context: ValidationContext,
): Promise<string | true> => {
  if (!value) return true;

  const isPrefix = context.document?.isPrefix === true;
  const others = await fetchOtherRedirects(context);

  if (others.some(({ source }) => source === value)) {
    return REDIRECT_DUPLICATE_SOURCE_ERROR;
  }

  const isIncoming = others.some(({ destination }) =>
    destination
      ? isPrefix
        ? isAtOrBeneath(destination, value)
        : destination === value
      : false,
  );

  return isIncoming ? REDIRECT_INCOMING_CHAIN_ERROR : true;
};

export const validateRedirectDestination = async (
  value: string | undefined,
  context: ValidationContext,
): Promise<string | true> => {
  if (!value) return true;

  const others = await fetchOtherRedirects(context);
  const isRedirected = others.some(({ source, isPrefix }) =>
    source
      ? isPrefix
        ? isAtOrBeneath(value, source)
        : value === source
      : false,
  );

  return isRedirected ? REDIRECT_OUTGOING_CHAIN_ERROR : true;
};
