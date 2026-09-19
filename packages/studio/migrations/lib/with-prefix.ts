const DRAFTS_PREFIX = 'drafts.';

export const withPrefix = (id: string, prefix: string): string => {
  const isDraft = id.startsWith(DRAFTS_PREFIX);
  const bare = isDraft ? id.slice(DRAFTS_PREFIX.length) : id;
  const prefixed = bare.startsWith(prefix) ? bare : `${prefix}${bare}`;

  return isDraft ? `${DRAFTS_PREFIX}${prefixed}` : prefixed;
};
