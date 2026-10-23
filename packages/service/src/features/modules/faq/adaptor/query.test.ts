import { BRAND_VARIANT, LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  MOCK_FAQ_MODULE_ID,
  mockRawFaqModule,
} from '@blog/service/testing/modules/fixtures';
import { mockReference } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  mockLocalizedHeadingBlock,
  mockLocalizedListedText,
  mockLocalizedStrings,
} from '@blog/service/testing/shared/localized';

import { faqModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const TRANSLATED_QUESTION_ID = 'question-1';
const UNTRANSLATED_QUESTION_ID = 'question-2';
const UNTRANSLATED_QUESTION = 'What does it cost?';
const UNTRANSLATED_ANSWER = 'It depends on scope.';

const EN_COPY = {
  heading: 'Questions',
  question: 'How long does it take?',
  answer: 'About six weeks.',
};

const NL_COPY = {
  heading: 'Vragen',
  question: 'Hoe lang duurt het?',
  answer: 'Ongeveer zes weken.',
};

const faqModuleDocument = {
  _id: MOCK_FAQ_MODULE_ID,
  _type: 'module_faq',
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockLocalizedHeadingBlock({
    [EN]: EN_COPY.heading,
    [NL]: NL_COPY.heading,
  }),
  questions: [
    mockReference(TRANSLATED_QUESTION_ID, { _key: 'q-1' }),
    mockReference(UNTRANSLATED_QUESTION_ID, { _key: 'q-2' }),
  ],
};

const translatedQuestion = {
  _id: TRANSLATED_QUESTION_ID,
  _type: 'block_faq',
  question: mockLocalizedStrings({
    [EN]: EN_COPY.question,
    [NL]: NL_COPY.question,
  }),
  answer: mockLocalizedListedText({
    [EN]: EN_COPY.answer,
    [NL]: NL_COPY.answer,
  }),
};

const untranslatedQuestion = {
  _id: UNTRANSLATED_QUESTION_ID,
  _type: 'block_faq',
  question: mockLocalizedStrings({ [EN]: UNTRANSLATED_QUESTION }),
  answer: mockLocalizedListedText({ [EN]: UNTRANSLATED_ANSWER }),
};

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
      NL_COPY,
    ],
    [
      'falls back to the default language for the heading and each question',
      FR,
      EN_COPY,
    ],
  ])('%s', async (_, locale, copy) => {
    const module = await runFaq(
      [faqModuleDocument, translatedQuestion, untranslatedQuestion],
      locale,
    );

    expect(module.headingBlock.heading).toBe(copy.heading);
    expect(questionText(module)).toEqual([
      { question: copy.question, answer: [[copy.answer]] },
      { question: UNTRANSLATED_QUESTION, answer: [[UNTRANSLATED_ANSWER]] },
    ]);
  });

  it('fails when an answer is missing in both languages', async () => {
    await expect(
      runFaq(
        [
          faqModuleDocument,
          translatedQuestion,
          {
            ...untranslatedQuestion,
            answer: mockLocalizedListedText({ [FR]: 'Cela dépend.' }),
          },
        ],
        NL,
      ),
    ).rejects.toThrow();
  });
});
