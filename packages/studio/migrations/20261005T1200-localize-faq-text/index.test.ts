import {
  mockLocalizedHeadingBlock,
  mockPlainHeadingBlock,
} from '@blog/studio/testing/migrations/localize';
import {
  mockEnglishString,
  mockInEnglish,
  mockParagraph,
} from '@blog/studio/testing/migrations/localized';
import { faker } from '@faker-js/faker';
import { at, set } from 'sanity/migrate';

import { localizeFaqDocument } from './index';

faker.seed(10);

const LISTED_TEXT_TYPE = 'internationalizedArrayListedTextValue';
const MOCK_QUESTION = faker.lorem.sentence();
const MOCK_HEADING = faker.lorem.words(2);
const MOCK_ANSWER = mockParagraph();

describe(localizeFaqDocument, () => {
  it('moves a question and its answer into the default language', () => {
    expect(
      localizeFaqDocument({
        _type: 'block_faq',
        question: MOCK_QUESTION,
        answer: MOCK_ANSWER,
      }),
    ).toEqual([
      at('question', set(mockEnglishString(MOCK_QUESTION))),
      at('answer', set(mockInEnglish(LISTED_TEXT_TYPE, MOCK_ANSWER))),
    ]);
  });

  it('moves an FAQ module heading block into the default language', () => {
    expect(
      localizeFaqDocument({
        _type: 'module_faq',
        headingBlock: mockPlainHeadingBlock(MOCK_HEADING),
      }),
    ).toEqual([
      at('headingBlock', set(mockLocalizedHeadingBlock(MOCK_HEADING))),
    ]);
  });

  it('localizes only the fields still holding plain text', () => {
    expect(
      localizeFaqDocument({
        _type: 'block_faq',
        question: mockEnglishString(MOCK_QUESTION),
        answer: MOCK_ANSWER,
      }),
    ).toEqual([
      at('answer', set(mockInEnglish(LISTED_TEXT_TYPE, MOCK_ANSWER))),
    ]);
  });

  it.each([
    {
      name: 'an already localized FAQ block',
      doc: {
        _type: 'block_faq' as const,
        question: mockEnglishString(MOCK_QUESTION),
        answer: mockInEnglish(LISTED_TEXT_TYPE, MOCK_ANSWER),
      },
    },
    {
      name: 'an already localized FAQ module',
      doc: {
        _type: 'module_faq' as const,
        headingBlock: mockLocalizedHeadingBlock(MOCK_HEADING),
      },
    },
    { name: 'an FAQ block without text', doc: { _type: 'block_faq' as const } },
    {
      name: 'an FAQ module without text',
      doc: { _type: 'module_faq' as const },
    },
  ])('leaves $name alone', ({ doc }) => {
    expect(localizeFaqDocument(doc)).toBeUndefined();
  });
});
