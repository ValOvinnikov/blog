import type { TLandingPageDocument } from '@blog/service/features/pages/landing/adaptor/detail-page/types';
import type { TFaqPageQuestion } from '@blog/service/shared/transformers/faq/resolve-faqs';

export type TLandingPage = TLandingPageDocument & { faqs: TFaqPageQuestion[] };
