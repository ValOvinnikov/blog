import { makeRawFaqModule } from '@blog/service/testing/modules/fixtures';

import { faqModuleQuery } from './query';

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
});
