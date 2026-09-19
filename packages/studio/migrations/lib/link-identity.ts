import { createHash } from 'node:crypto';

import { LINK_TYPE } from '@blog/config/constants';

const LINK_ID_PREFIX = 'link-';

export type TLinkIdentitySource = {
  label?: string;
  linkType?: string;
  internalReference?: { _ref?: string };
  url?: string;
};

/** Includes the label in the dedup key, since a `link` document has one required label and destination-only dedup would silently merge two links with different wording. */
export const toLinkIdentityKey = (
  link: TLinkIdentitySource,
): string | undefined => {
  if (link.linkType === LINK_TYPE.INTERNAL) {
    return link.internalReference?._ref
      ? `internal:${link.internalReference._ref}|label:${link.label ?? ''}`
      : undefined;
  }

  if (link.linkType === LINK_TYPE.EXTERNAL) {
    return link.url
      ? `external:${link.url}|label:${link.label ?? ''}`
      : undefined;
  }

  return undefined;
};

export const toLinkId = (identityKey: string): string =>
  `${LINK_ID_PREFIX}${createHash('sha1').update(identityKey).digest('hex').slice(0, 16)}`;
