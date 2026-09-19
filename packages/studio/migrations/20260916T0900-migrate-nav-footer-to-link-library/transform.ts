import { LINK_TYPE } from '@blog/config/constants';

import { LINK_LABEL_MAX_LENGTH } from '../lib/link-label-max-length';

export const LINK_REF_TYPE = 'linkRef';
export const SOCIAL_PROFILE_TYPE = 'socialProfile';

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
