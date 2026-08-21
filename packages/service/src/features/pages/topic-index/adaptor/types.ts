import type { TSeoResolved } from '@blog/service/shared/transformers/resolve-seo';

export type TTopicIndexPage = {
  heading: string;
  supportingText?: string;
  seo: TSeoResolved;
  taxonomyListId: string;
};
