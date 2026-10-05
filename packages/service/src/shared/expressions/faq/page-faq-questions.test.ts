import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  localizedStrings,
  localizedValues,
  paragraphBlocks,
} from '@blog/service/testing/shared/localized';

import {
  PAGE_FAQ_QUESTIONS_EXPRESSION,
  pageFaqQuestionsParser,
} from './page-faq-questions';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const root = {
  modules: [{ _type: 'reference', _ref: 'module-faq-a' }],
};

const dataset = [
  {
    _id: 'module-faq-a',
    _type: 'module_faq',
    questions: [
      { _type: 'reference', _ref: 'block-faq-ok' },
      { _type: 'reference', _ref: 'block-faq-missing' },
    ],
  },
  {
    _id: 'block-faq-ok',
    _type: 'block_faq',
    question: localizedStrings({ [EN]: 'How much?', [NL]: 'Hoeveel?' }),
    answer: localizedValues('internationalizedArrayListedTextValue', {
      [EN]: paragraphBlocks('It depends.'),
      [NL]: paragraphBlocks('Dat hangt ervan af.'),
    }),
  },
];

async function runPageFaqs(locale: string) {
  return pageFaqQuestionsParser.parse(
    await evaluateGroqExpression(PAGE_FAQ_QUESTIONS_EXPRESSION, dataset, root, {
      locale,
      defaultLocale: EN,
    }),
  );
}

describe('PAGE_FAQ_QUESTIONS_EXPRESSION', () => {
  it('filters modules to module_faq before flattening their questions', () => {
    expect(PAGE_FAQ_QUESTIONS_EXPRESSION).toContain('_type == "module_faq"');
  });

  it('coalesces to an empty array when the page has no modules', () => {
    expect(PAGE_FAQ_QUESTIONS_EXPRESSION).toMatch(/^coalesce\(.*, \[\]\)$/);
  });

  it('parses a list of plain-text questions', () => {
    const parsed = pageFaqQuestionsParser.parse([
      { id: 'block-faq-1', question: 'How much?', answer: 'It depends.' },
    ]);

    expect(parsed).toEqual([
      { id: 'block-faq-1', question: 'How much?', answer: 'It depends.' },
    ]);
  });

  it('rejects a null entry', () => {
    expect(() => pageFaqQuestionsParser.parse([null])).toThrow();
  });

  it('drops a question whose block_faq reference is dangling', async () => {
    expect(await runPageFaqs(EN)).toEqual([
      { id: 'block-faq-ok', question: 'How much?', answer: 'It depends.' },
    ]);
  });

  it('reads each question and answer in the visitor language', async () => {
    expect(await runPageFaqs(NL)).toEqual([
      {
        id: 'block-faq-ok',
        question: 'Hoeveel?',
        answer: 'Dat hangt ervan af.',
      },
    ]);
  });

  it('falls back to the default language', async () => {
    expect(await runPageFaqs(FR)).toEqual([
      { id: 'block-faq-ok', question: 'How much?', answer: 'It depends.' },
    ]);
  });
});
