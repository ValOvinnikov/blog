import type { TLandingPageDocument } from '@shinefold/service/features/pages/landing/adaptor/detail-page/types';
import type { TFaqPageQuestion } from '@shinefold/service/shared/transformers/faq/resolve-faqs';

export type TLandingPage = TLandingPageDocument & { faqs: TFaqPageQuestion[] };
