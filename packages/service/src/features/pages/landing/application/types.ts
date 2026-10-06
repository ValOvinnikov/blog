import type { TLandingPageDocument } from '@blog/service/features/pages/landing/adaptor/detail-page/types';
import type { TWithPageFaqs } from '@blog/service/shared/adaptors/faq-questions/page-faqs';

export type TLandingPage = TWithPageFaqs<TLandingPageDocument>;
