import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { makeRawFaqModule } from '@blog/service/testing/modules/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  localizedStrings,
  localizedValues,
  paragraphBlocks,
} from '@blog/service/testing/shared/localized';

import { faqModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

function localizedAnswer(values: Record<string, string>) {
  return localizedValues(
    'internationalizedArrayListedTextValue',
    Object.fromEntries(
      Object.entries(values).map(([language, text]) => [
        language,
        paragraphBlocks(text),
      ]),
    ),
  );
}

const faqModuleDocument = {
  _id: 'faq-1',
  _type: 'module_faq',
  brandVariant: 'PRIMARY',
  headingBlock: {
    _type: 'moduleHeadingBlock',
    heading: localizedStrings({
      [EN]: 'Questions',
      [NL]: 'Vragen',
    }),
  },
  questions: [
    { _key: 'q-1', _type: 'reference', _ref: 'question-1' },
    { _key: 'q-2', _type: 'reference', _ref: 'question-2' },
  ],
};

const translatedQuestion = {
  _id: 'question-1',
  _type: 'block_faq',
  question: localizedStrings({
    [EN]: 'How long does it take?',
    [NL]: 'Hoe lang duurt het?',
  }),
  answer: localizedAnswer({
    [EN]: 'About six weeks.',
    [NL]: 'Ongeveer zes weken.',
  }),
};

const untranslatedQuestion = {
  _id: 'question-2',
  _type: 'block_faq',
  question: localizedStrings({ [EN]: 'What does it cost?' }),
  answer: localizedAnswer({ [EN]: 'It depends on scope.' }),
};

async function runFaq(dataset: Record<string, unknown>[], locale: string) {
  const raw = await evaluateGroqExpression(
    faqModuleQuery.query,
    dataset,
    undefined,
    { id: 'faq-1', locale, defaultLocale: EN },
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
  it('filters to module_faq documents by id', () => {
    expect(faqModuleQuery.query).toContain('_type == "module_faq"');
    expect(faqModuleQuery.query).toContain('_id == $id');
  });

  it('parses a module with fully populated questions', () => {
    const raw = makeRawFaqModule();

    expect(() => faqModuleQuery.parse(raw)).not.toThrow();
  });

  it('rejects a module with no headingBlock', () => {
    const raw = { ...makeRawFaqModule(), headingBlock: null };

    expect(() => faqModuleQuery.parse(raw)).toThrow();
  });

  it('rejects a module with no questions', () => {
    const raw = { ...makeRawFaqModule(), questions: null };

    expect(() => faqModuleQuery.parse(raw)).toThrow();
  });

  it('rejects a question with no question text', () => {
    const [firstQuestion] = makeRawFaqModule().questions;

    const raw = {
      ...makeRawFaqModule(),
      questions: [{ ...firstQuestion, question: null }],
    };

    expect(() => faqModuleQuery.parse(raw)).toThrow();
  });

  it('rejects a question with no answer', () => {
    const [firstQuestion] = makeRawFaqModule().questions;

    const raw = {
      ...makeRawFaqModule(),
      questions: [{ ...firstQuestion, answer: null }],
    };

    expect(() => faqModuleQuery.parse(raw)).toThrow();
  });

  it('picks the heading and each question and answer in the visitor language', async () => {
    const module = await runFaq(
      [faqModuleDocument, translatedQuestion, untranslatedQuestion],
      NL,
    );

    expect(module.headingBlock.heading).toBe('Vragen');
    expect(questionText(module)).toEqual([
      { question: 'Hoe lang duurt het?', answer: [['Ongeveer zes weken.']] },
      { question: 'What does it cost?', answer: [['It depends on scope.']] },
    ]);
  });

  it('falls back to the default language for the heading and each question', async () => {
    const module = await runFaq(
      [faqModuleDocument, translatedQuestion, untranslatedQuestion],
      FR,
    );

    expect(module.headingBlock.heading).toBe('Questions');
    expect(questionText(module)).toEqual([
      { question: 'How long does it take?', answer: [['About six weeks.']] },
      { question: 'What does it cost?', answer: [['It depends on scope.']] },
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
            answer: localizedAnswer({ [FR]: 'Cela dépend.' }),
          },
        ],
        NL,
      ),
    ).rejects.toThrow();
  });
});
