import type { THomePageDocument } from '@blog/service/features/pages/home/adaptor/types';
import type { TWithPageFaqs } from '@blog/service/shared/adaptors/faq-questions/page-faqs';

export type THomePage = TWithPageFaqs<THomePageDocument>;
