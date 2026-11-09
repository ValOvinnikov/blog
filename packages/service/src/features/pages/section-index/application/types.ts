import type { TSectionIndexPageDocument } from '@blog/service/features/pages/section-index/adaptor/types';
import type { TFaqPageQuestion } from '@blog/service/shared/transformers/faq/resolve-faqs';

export type TSectionIndexPage = TSectionIndexPageDocument & {
  faqs: TFaqPageQuestion[];
};
