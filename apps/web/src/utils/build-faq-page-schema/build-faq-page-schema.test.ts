import type { TFaqPageQuestion } from '@blog/service';

import { buildFaqPageSchema } from './build-faq-page-schema';

const faqs: TFaqPageQuestion[] = [
  { id: 'faq-1', question: 'Do you offer a free trial?', answer: 'Yes.' },
  { id: 'faq-2', question: 'Can I cancel anytime?', answer: 'Yes, anytime.' },
];

describe(buildFaqPageSchema, () => {
  it('maps questions into mainEntity in order', () => {
    const schema = buildFaqPageSchema(faqs);

    expect(schema).toEqual({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Do you offer a free trial?',
          acceptedAnswer: { '@type': 'Answer', text: 'Yes.' },
        },
        {
          '@type': 'Question',
          name: 'Can I cancel anytime?',
          acceptedAnswer: { '@type': 'Answer', text: 'Yes, anytime.' },
        },
      ],
    });
  });

  it('returns undefined when there are no FAQ questions', () => {
    expect(buildFaqPageSchema([])).toBeUndefined();
  });
});
