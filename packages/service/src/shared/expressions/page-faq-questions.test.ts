import {
  PAGE_FAQ_QUESTIONS_EXPRESSION,
  pageFaqQuestionsParser,
} from './page-faq-questions';

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

  it('rejects a null entry, the shape a filter-after-deref GROQ traversal produces', () => {
    expect(() => pageFaqQuestionsParser.parse([null])).toThrow();
  });
});
