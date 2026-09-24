import { rewriteRefsDeep } from '../lib/rewrite-refs';

export type TBlogAuthorDoc = {
  _id: string;
  name?: string;
  image?: unknown;
  bio?: unknown;
  role?: string;
  socialLinks?: unknown;
  profilePage?: unknown;
};

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
