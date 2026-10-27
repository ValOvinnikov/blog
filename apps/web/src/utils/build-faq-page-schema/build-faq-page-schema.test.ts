import type { TFaqPageQuestion } from '@blog/service';
import { faker } from '@faker-js/faker';

import { buildFaqPageSchema } from './build-faq-page-schema';

faker.seed(102);

const MOCK_FAQS: TFaqPageQuestion[] = Array.from({ length: 2 }, () => ({
  id: faker.string.uuid(),
  question: faker.lorem.sentence(),
  answer: faker.lorem.sentences(2),
}));

describe(buildFaqPageSchema, () => {
  it('maps questions into mainEntity in order', () => {
    const schema = buildFaqPageSchema(MOCK_FAQS);

    expect(schema).toEqual({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: MOCK_FAQS.map(({ question, answer }) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: { '@type': 'Answer', text: answer },
      })),
    });
  });

  it('returns undefined when there are no FAQ questions', () => {
    const schema = buildFaqPageSchema([]);

    expect(schema).toBeUndefined();
  });
});
