import { rewriteRefsDeep } from './rewrite-refs';

export type TBlogAuthorDoc = {
  _id: string;
  name?: string;
  image?: unknown;
  bio?: unknown;
  role?: string;
  socialLinks?: unknown;
  profilePage?: unknown;
};

/**
 * Copies every `blog_author` field onto its `person` shape 1:1 — the two
 * types share the same fields, so this is a plain carry, not a merge.
 */
export const buildPersonFields = (
  author: TBlogAuthorDoc,
  idMap: ReadonlyMap<string, string>,
): Record<string, unknown> =>
  rewriteRefsDeep(
    {
      name: author.name,
      image: author.image,
      bio: author.bio,
      role: author.role,
      socialLinks: author.socialLinks,
      profilePage: author.profilePage,
    },
    idMap,
  );
