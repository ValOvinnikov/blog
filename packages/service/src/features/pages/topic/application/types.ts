import type { TTopicDetailPageDocument } from '@blog/service/features/pages/topic/adaptor/detail-page/types';
import type { TFaqPageQuestion } from '@blog/service/shared/transformers/faq/resolve-faqs';

export type TTopicDetailPage = TTopicDetailPageDocument & {
  faqs: TFaqPageQuestion[];
};
