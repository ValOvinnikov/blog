import type { TSeoResolved } from '@blog/service/shared/transformers/resolve-seo';
import type { TModule } from '@blog/service/shared/transformers/to-module';

export type TBlogIndexPage = {
  heading: string;
  supportingText?: string;
  modules: TModule[];
  seo: TSeoResolved;
  postListId: string;
};
