import type { TMaybeUndefined } from '@blog/config';
import type { TSeoResolved } from '@blog/service/shared/transformers/resolve-seo';
import type { TArchivePostCard } from '@blog/service/shared/transformers/to-archive-post-card';

// The tag page's own richer tag shape — `description`/`seo` on top of the
// minimal `{id,title,slug}` chip shape `TTag` provides for the post-detail
// tags projection.
export type TTagPageTag = {
  id: string;
  title: string;
  slug: string;
  description: TMaybeUndefined<string>;
  seo: TSeoResolved;
};

export type TTagPage = {
  tag: TTagPageTag;
  posts: TArchivePostCard[];
  currentPage: number;
  totalPages: number;
};
