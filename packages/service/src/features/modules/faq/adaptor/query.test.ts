import { faker } from '@faker-js/faker';
import { BRAND_VARIANT, LOCALE_ISO_CODES } from '@shinefold/config/constants';
import { mockRawFaqModule } from '@shinefold/service/testing/modules/faq/fixtures';
import { MOCK_FAQ_MODULE_ID } from '@shinefold/service/testing/modules/fixtures';
import { mockReference } from '@shinefold/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@shinefold/service/testing/shared/groq';
import {
  mockLocalizedHeadingBlock,
  mockLocalizedListedText,
  mockLocalizedStrings,
  mockParagraphBlocks,
} from '@shinefold/service/testing/shared/localized';
import { MOCK_AUTHORED_CARD_APPEARANCE } from '@shinefold/service/testing/shared/module-appearance';

import { faqModuleQuery } from './query';

faker.seed(7);

const { EN, NL, FR } = LOCALE_ISO_CODES;

const MOCK_TRANSLATED_QUESTION_ID = faker.string.uuid();
const MOCK_UNTRANSLATED_QUESTION_ID = faker.string.uuid();
const MOCK_UNTRANSLATED_QUESTION = faker.lorem.sentence();
const MOCK_UNTRANSLATED_ANSWER = faker.lorem.sentence();
const MOCK_FRENCH_ONLY_ANSWER = faker.lorem.sentence();

const MOCK_EN_COPY = {
  heading: faker.lorem.words(2),
  question: faker.lorem.sentence(),
  answer: faker.lorem.sentence(),
};

const MOCK_NL_COPY = {
  heading: faker.lorem.words(2),
  question: faker.lorem.sentence(),
  answer: faker.lorem.sentence(),
};

const MOCK_FAQ_MODULE_DOCUMENT = {
  _id: MOCK_FAQ_MODULE_ID,
  _type: 'module_faq',
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockLocalizedHeadingBlock({
    [EN]: MOCK_EN_COPY.heading,
    [NL]: MOCK_NL_COPY.heading,
  }),
  questions: [
    mockReference(MOCK_TRANSLATED_QUESTION_ID, { _key: faker.string.uuid() }),
    mockReference(MOCK_UNTRANSLATED_QUESTION_ID, {
      _key: faker.string.uuid(),
    }),
  ],
};

const MOCK_TRANSLATED_QUESTION = {
  _id: MOCK_TRANSLATED_QUESTION_ID,
  _type: 'block_faq',
  question: mockLocalizedStrings({
    [EN]: MOCK_EN_COPY.question,
    [NL]: MOCK_NL_COPY.question,
  }),
  answer: mockLocalizedListedText({
    [EN]: MOCK_EN_COPY.answer,
    [NL]: MOCK_NL_COPY.answer,
  }),
};

const MOCK_UNTRANSLATED_QUESTION_DOCUMENT = {
  _id: MOCK_UNTRANSLATED_QUESTION_ID,
  _type: 'block_faq',
  question: mockLocalizedStrings({ [EN]: MOCK_UNTRANSLATED_QUESTION }),
  answer: mockLocalizedListedText({ [EN]: MOCK_UNTRANSLATED_ANSWER }),
};

const MOCK_FAQ_DATASET = [
  MOCK_FAQ_MODULE_DOCUMENT,
  MOCK_TRANSLATED_QUESTION,
  MOCK_UNTRANSLATED_QUESTION_DOCUMENT,
];

async function runFaq(dataset: Record<string, unknown>[], locale: string) {
  const raw = await evaluateGroqExpression(
    faqModuleQuery.query,
    dataset,
    undefined,
    { id: MOCK_FAQ_MODULE_ID, locale, defaultLocale: EN },
  );

  return faqModuleQuery.parse(raw);
}

function questionText(module: Awaited<ReturnType<typeof runFaq>>) {
  return module.questions.map(({ question, answer }) => ({
    question,
    answer: answer.map((block) => block.children?.map(({ text }) => text)),
  }));
}

describe('faqModuleQuery', () => {
  let firstQuestion: ReturnType<typeof mockRawFaqModule>['questions'][number];

  beforeEach(() => {
    const [question] = mockRawFaqModule().questions;
    if (!question) throw new Error('expected a fixture faq question');
    firstQuestion = question;
  });

  it('parses a module with fully populated questions', () => {
    const raw = mockRawFaqModule();

    expect(() => faqModuleQuery.parse(raw)).not.toThrow();
  });

  it.each([
    ['no headingBlock', () => ({ ...mockRawFaqModule(), headingBlock: null })],
    ['no questions', () => ({ ...mockRawFaqModule(), questions: null })],
    [
      'a question with no question text',
      () => ({
        ...mockRawFaqModule(),
        questions: [{ ...firstQuestion, question: null }],
      }),
    ],
    [
      'a question with no answer',
      () => ({
        ...mockRawFaqModule(),
        questions: [{ ...firstQuestion, answer: null }],
      }),
    ],
  ])('rejects a module with %s', (_, buildRaw) => {
    expect(() => faqModuleQuery.parse(buildRaw())).toThrow();
  });

  it.each([
    [
      'picks the heading and each question in the visitor language',
      NL,
      MOCK_NL_COPY,
    ],
    [
      'falls back to the default language for the heading and each question',
      FR,
      MOCK_EN_COPY,
    ],
  ])('%s', async (_, locale, copy) => {
    const module = await runFaq(MOCK_FAQ_DATASET, locale);

    expect(module.headingBlock.heading).toEqual(
      mockParagraphBlocks(copy.heading),
    );
    expect(questionText(module)).toEqual([
      { question: copy.question, answer: [[copy.answer]] },
      {
        question: MOCK_UNTRANSLATED_QUESTION,
        answer: [[MOCK_UNTRANSLATED_ANSWER]],
      },
    ]);
  });

  it('fails when an answer is missing in both languages', async () => {
    await expect(
      runFaq(
        [
          MOCK_FAQ_MODULE_DOCUMENT,
          MOCK_TRANSLATED_QUESTION,
          {
            ...MOCK_UNTRANSLATED_QUESTION_DOCUMENT,
            answer: mockLocalizedListedText({ [FR]: MOCK_FRENCH_ONLY_ANSWER }),
          },
        ],
        NL,
      ),
    ).rejects.toThrow();
  });

  it('reads no appearance overrides from a document authored without them', async () => {
    const module = await runFaq(MOCK_FAQ_DATASET, EN);

    expect(module).toMatchObject({
      cardStyle: null,
      radiusScale: null,
      density: null,
    });
  });

  it('reads the authored appearance overrides', async () => {
    const [, ...questions] = MOCK_FAQ_DATASET;

    const module = await runFaq(
      [
        { ...MOCK_FAQ_MODULE_DOCUMENT, ...MOCK_AUTHORED_CARD_APPEARANCE },
        ...questions,
      ],
      EN,
    );

    expect(module).toMatchObject(MOCK_AUTHORED_CARD_APPEARANCE);
  });
});
