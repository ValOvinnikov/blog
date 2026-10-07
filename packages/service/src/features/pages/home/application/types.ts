import type { THomePageDocument } from '@blog/service/features/pages/home/adaptor/types';
import type { TFaqPageQuestion } from '@blog/service/shared/transformers/faq/resolve-faqs';

export type THomePage = THomePageDocument & { faqs: TFaqPageQuestion[] };
