import { LINK_TYPE } from '@blog/config/constants';

const DRAFTS_PREFIX = 'drafts.';

const slugify = (value: string): string => {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'unset';
};

export type TLinkIdentity = {
  label?: string;
  linkType?: string;
  internalReference?: { _ref?: string };
  url?: string;
};

/**
 * Derives a deterministic `shared_link` id from the link's own destination
 * and label, not from the document that holds it — so two call sites
 * pointing at the same destination (e.g. `module_hero` and
 * `module_heroBlog` both linking to the post index as "Read Latest")
 * converge on one `shared_link` document instead of seeding a duplicate.
 * The `drafts.` prefix, when present, still comes from the *containing*
 * document, so a link visible only in a draft never seeds a published
 * `shared_link`.
 */
export const toSharedLinkId = (
  containingId: string,
  link: TLinkIdentity,
): string => {
  const isDraft = containingId.startsWith(DRAFTS_PREFIX);
  const linkType = link.linkType ?? LINK_TYPE.INTERNAL;
  const target =
    linkType === LINK_TYPE.EXTERNAL
      ? (link.url ?? '')
      : (link.internalReference?._ref ?? '');
  const id = [
    'shared_link',
    slugify(linkType),
    slugify(target),
    slugify(link.label ?? 'link'),
  ].join('-');

  return isDraft ? `${DRAFTS_PREFIX}${id}` : id;
};
