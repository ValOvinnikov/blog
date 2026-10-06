import type { TTopicDetailPageDocument } from '@blog/service/features/pages/topic/adaptor/detail-page/types';
import type { TWithPageFaqs } from '@blog/service/shared/adaptors/faq-questions/page-faqs';

export type TTopicDetailPage = TWithPageFaqs<TTopicDetailPageDocument>;
