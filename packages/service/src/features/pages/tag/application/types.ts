import type { TTagDetailPageDocument } from '@blog/service/features/pages/tag/adaptor/detail-page/types';
import type { TFaqPageQuestion } from '@blog/service/shared/transformers/faq/resolve-faqs';

export type TTagDetailPage = TTagDetailPageDocument & {
  faqs: TFaqPageQuestion[];
};
