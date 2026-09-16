import { LINK_TYPE } from '@blog/config/constants';

const LINK_DOCUMENT_TYPE = 'link';
export const LINK_REF_TYPE = 'linkRef';
export const SOCIAL_PROFILE_TYPE = 'socialProfile';

/** Mirrors `link.ts`'s `label` field — `rule.required().max(60)`. */
export const LINK_LABEL_MAX_LENGTH = 60;

/**
 * Both a pre-rename `link` object and its post-rename `inlineLink`
 * successor are valid legacy shapes — the rename migration has not
 * necessarily run on every dataset this migration targets.
 */
const RECOGNIZED_LEGACY_LINK_TYPES = new Set(['link', 'inlineLink']);

export type TLegacyInlineLink = {
  _type?: string;
  label?: string;
  accessibleLabel?: string;
  linkType?: string;
  internalReference?: { _ref?: string };
  url?: string;
  openInNewTab?: boolean;
  platform?: string;
};

/** A legacy array entry — the destination fields above plus the array `_key` every entry carries. */
export type TLegacyLinkEntry = TLegacyInlineLink & { _key: string };

export type TLinkDocumentFields = {
  _id: string;
  _type: typeof LINK_DOCUMENT_TYPE;
  title: string;
  label?: string;
  linkType?: string;
  openInNewTab?: boolean;
  internalReference?: { _type: 'reference'; _ref: string };
  url?: string;
};

export const hasRecognizedLinkShape = (item: TLegacyInlineLink): boolean =>
  item._type === undefined || RECOGNIZED_LEGACY_LINK_TYPES.has(item._type);

/**
 * Whether an external item's `url` would pass `link.ts`'s validator — a
 * full `http(s)://` address with a host. The legacy `inlineLink` shape also
 * permitted a relative path (e.g. `/blog`), which `link` does not accept.
 */
export const hasResolvableUrl = (item: TLegacyInlineLink): boolean => {
  if (item.linkType !== LINK_TYPE.EXTERNAL) return true;
  if (!item.url) return false;

  try {
    const parsed = new URL(item.url);
    return /^https?:$/.test(parsed.protocol) && Boolean(parsed.hostname);
  } catch {
    return false;
  }
};

/**
 * Builds the `link` document for one destination. `platform` and
 * `accessibleLabel` have no field on `link` and are dropped by omission —
 * the migration reports every non-empty occurrence separately.
 */
export const buildLinkDocumentFields = (
  linkId: string,
  title: string,
  item: TLegacyInlineLink,
): TLinkDocumentFields => ({
  _id: linkId,
  _type: LINK_DOCUMENT_TYPE,
  title,
  label: item.label,
  linkType: item.linkType,
  openInNewTab: item.openInNewTab,
  ...(item.linkType === LINK_TYPE.INTERNAL && item.internalReference?._ref
    ? {
        internalReference: {
          _type: 'reference' as const,
          _ref: item.internalReference._ref,
        },
      }
    : {}),
  ...(item.linkType === LINK_TYPE.EXTERNAL && item.url
    ? { url: item.url }
    : {}),
});

export type TLinkRefNode = {
  _key: string;
  _type: typeof LINK_REF_TYPE;
  link: { _type: 'reference'; _ref: string };
};

/** Builds a `linkRef` entry pointing at the deduped `link` document. */
export const buildLinkRef = (
  item: TLegacyLinkEntry,
  linkId: string,
): TLinkRefNode => ({
  _key: item._key,
  _type: LINK_REF_TYPE,
  link: { _type: 'reference', _ref: linkId },
});

export type TSocialProfileNode = {
  _key: string;
  _type: typeof SOCIAL_PROFILE_TYPE;
  platform?: string;
  link: { _type: 'reference'; _ref: string };
};

/**
 * Builds a `socialProfile` entry, keeping `platform` on the wrapper — the
 * `link` document itself has no `platform` field.
 */
export const buildSocialProfile = (
  item: TLegacyLinkEntry,
  linkId: string,
): TSocialProfileNode => ({
  _key: item._key,
  _type: SOCIAL_PROFILE_TYPE,
  platform: item.platform,
  link: { _type: 'reference', _ref: linkId },
});

export const hasMissingLabel = (item: TLegacyInlineLink): boolean =>
  !item.label?.trim();

export const hasOversizedLabel = (item: TLegacyInlineLink): boolean =>
  Boolean(item.label && item.label.length > LINK_LABEL_MAX_LENGTH);
