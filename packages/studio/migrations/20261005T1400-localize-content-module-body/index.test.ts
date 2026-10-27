import {
  mockInEnglish,
  mockParagraph,
} from '@blog/studio/testing/migrations/localized';
import { faker } from '@faker-js/faker';
import { at, set } from 'sanity/migrate';

import { localizeContentModule } from './index';

faker.seed(14);

const ARTICLE_TEXT_TYPE = 'internationalizedArrayArticleTextValue';
const MOCK_BODY = [
  ...mockParagraph(),
  {
    _type: 'bodyImage',
    _key: faker.string.alphanumeric(12),
    asset: { _type: 'reference', _ref: faker.string.uuid() },
    alt: faker.lorem.words(3),
    layout: 'FULL_BLEED',
  },
  {
    _type: 'code',
    _key: faker.string.alphanumeric(12),
    language: 'ts',
    code: faker.lorem.sentence(),
  },
  {
    _type: 'aside',
    _key: faker.string.alphanumeric(12),
    kind: 'CONTEXT',
    body: mockParagraph(),
  },
];

describe(localizeContentModule, () => {
  it('moves the body, embedded blocks included, into the default language', () => {
    expect(localizeContentModule({ body: MOCK_BODY })).toEqual([
      at('body', set(mockInEnglish(ARTICLE_TEXT_TYPE, MOCK_BODY))),
    ]);
  });

  it.each([
    {
      name: 'an already localized body',
      doc: { body: mockInEnglish(ARTICLE_TEXT_TYPE, MOCK_BODY) },
    },
    { name: 'a module without a body', doc: {} },
  ])('leaves $name alone', ({ doc }) => {
    expect(localizeContentModule(doc)).toBeUndefined();
  });
});
