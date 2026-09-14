const DRAFTS_PREFIX = 'drafts.';

/**
 * Derives a deterministic `shared_link` id from the id of the document that
 * held the legacy inline link, plus a suffix naming the field/position it
 * came from — stable across re-runs, so `createIfNotExists` only ever fires
 * once per link.
 */
export const toSharedLinkId = (containingId: string, suffix: string): string => {
  const isDraft = containingId.startsWith(DRAFTS_PREFIX);
  const bare = isDraft ? containingId.slice(DRAFTS_PREFIX.length) : containingId;
  const id = `shared_link-${bare}-${suffix}`;

  return isDraft ? `${DRAFTS_PREFIX}${id}` : id;
};
