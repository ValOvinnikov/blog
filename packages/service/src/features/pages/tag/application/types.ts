import type { TTagDetailPageDocument } from '@shinefold/service/features/pages/tag/adaptor/detail-page/types';
import type { TFaqPageQuestion } from '@shinefold/service/shared/transformers/faq/resolve-faqs';

export type TTagDetailPage = TTagDetailPageDocument & {
  faqs: TFaqPageQuestion[];
};
