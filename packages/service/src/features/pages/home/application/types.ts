import type { THomePageDocument } from '@shinefold/service/features/pages/home/adaptor/types';
import type { TFaqPageQuestion } from '@shinefold/service/shared/transformers/faq/resolve-faqs';

export type THomePage = THomePageDocument & { faqs: TFaqPageQuestion[] };
