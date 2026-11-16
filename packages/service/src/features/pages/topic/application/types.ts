import type { TTopicDetailPageDocument } from '@shinefold/service/features/pages/topic/adaptor/detail-page/types';
import type { TFaqPageQuestion } from '@shinefold/service/shared/transformers/faq/resolve-faqs';

export type TTopicDetailPage = TTopicDetailPageDocument & {
  faqs: TFaqPageQuestion[];
};
