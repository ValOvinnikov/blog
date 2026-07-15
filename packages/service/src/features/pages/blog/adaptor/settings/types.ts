import type { TSeoMeta } from '@blog/service/shared/transformers/to-seo-meta';

export type TBlogIndexSettings = {
  heading: string;
  supportingText?: string;
  itemsPerPage: number;
  seo?: TSeoMeta;
};
