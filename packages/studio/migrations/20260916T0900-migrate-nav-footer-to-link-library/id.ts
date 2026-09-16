import { createHash } from 'node:crypto';

import { LINK_TYPE } from '@blog/config/constants';

import type { TLegacyInlineLink } from './transform';

const LINK_ID_PREFIX = 'link-';

/**
 * The string a link collapses to for dedup — two legacy links with the
 * same key resolve to one created `link` document. Keyed on destination
 * *and* label together: a `link` document has one required `label`, so two
 * legacy links at the same destination but with different visible wording
 * must stay distinct `link` documents, not merge and silently pick one.
 */
export const toLinkIdentityKey = (
  link: TLegacyInlineLink,
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

/**
 * Deterministic `link` document id for a destination identity key — the
 * same destination always resolves to the same id, whether it recurs
 * within one document, across documents, or across a re-run.
 */
export const toLinkId = (identityKey: string): string =>
  `${LINK_ID_PREFIX}${createHash('sha1').update(identityKey).digest('hex').slice(0, 16)}`;
