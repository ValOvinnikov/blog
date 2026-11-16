import type { TSectionIndexPageDocument } from '@shinefold/service/features/pages/section-index/adaptor/types';
import type { TFaqPageQuestion } from '@shinefold/service/shared/transformers/faq/resolve-faqs';

export type TSectionIndexPage = TSectionIndexPageDocument & {
  faqs: TFaqPageQuestion[];
};
