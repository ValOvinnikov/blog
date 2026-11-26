import type { TFaqPageQuestion } from '@shinefold/service';
import { hasLength } from '@shinefold/utils/primitives';

export type TFaqPageSchema = {
  '@context': 'https://schema.org';
  '@type': 'FAQPage';
  mainEntity: Array<{
    '@type': 'Question';
    name: string;
    acceptedAnswer: { '@type': 'Answer'; text: string };
  }>;
};

export const buildFaqPageSchema = (
  faqs: TFaqPageQuestion[],
): TFaqPageSchema | undefined => {
  if (!hasLength(faqs)) return undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
};
