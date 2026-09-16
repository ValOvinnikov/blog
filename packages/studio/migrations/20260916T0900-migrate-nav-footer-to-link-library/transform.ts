import { LINK_TYPE } from '@blog/config/constants';

const LINK_DOCUMENT_TYPE = 'link';
export const LINK_REF_TYPE = 'linkRef';
export const SOCIAL_PROFILE_TYPE = 'socialProfile';

/** Mirrors `link.ts`'s `label` field — `rule.required().max(60)`. */
export const LINK_LABEL_MAX_LENGTH = 60;

/** Both a pre-rename `link` object and its post-rename `inlineLink` successor are valid legacy shapes, since the rename migration may not have run on every target dataset. */
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

/** The legacy `inlineLink` shape also permitted a relative `url` (e.g. `/blog`), which `link`'s validator rejects. */
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

/** `platform` and `accessibleLabel` have no field on `link` and are dropped by omission; each non-empty occurrence is reported separately. */
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

/** Keeps `platform` on the wrapper, since the `link` document itself has no `platform` field. */
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
