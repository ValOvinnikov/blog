import type { TMaybeUndefined } from '@blog/config';
import type { TSeoResolved } from '@blog/service/shared/transformers/resolve-seo';
import type { TModule } from '@blog/service/shared/transformers/to-module';

// The tag page's own richer tag shape — `description` on top of the minimal
// `{id,title,slug}` chip shape `TTag` provides for the post-detail tags
// projection.
export type TTagDetailPageTag = {
  id: string;
  title: string;
  slug: string;
  description: TMaybeUndefined<string>;
};

export type TTagDetailPage = {
  tag: TTagDetailPageTag;
  modules: TModule[];
  seo: TSeoResolved;
  postListId: string;
};
