import { evaluate, parse } from 'groq-js';

import {
  PAGE_FAQ_QUESTIONS_EXPRESSION,
  pageFaqQuestionsParser,
} from './page-faq-questions';

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
    question: 'How much?',
    answer: [
      {
        _type: 'block',
        children: [{ _type: 'span', text: 'It depends.' }],
      },
    ],
  },
];

async function evaluateExpression(root: unknown): Promise<unknown> {
  const value = await evaluate(parse(PAGE_FAQ_QUESTIONS_EXPRESSION), {
    root,
    dataset,
  });

  return value.get();
}

describe('PAGE_FAQ_QUESTIONS_EXPRESSION', () => {
  it('filters modules to module_faq before flattening their questions', () => {
    expect(PAGE_FAQ_QUESTIONS_EXPRESSION).toContain('_type == "module_faq"');
    expect(PAGE_FAQ_QUESTIONS_EXPRESSION).toContain('pt::text(answer)');
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
    const root = {
      modules: [{ _type: 'reference', _ref: 'module-faq-a' }],
    };

    const parsed = pageFaqQuestionsParser.parse(await evaluateExpression(root));

    expect(parsed).toEqual([
      { id: 'block-faq-ok', question: 'How much?', answer: 'It depends.' },
    ]);
  });
});
