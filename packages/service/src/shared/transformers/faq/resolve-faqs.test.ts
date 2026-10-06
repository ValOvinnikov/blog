import {
  makeRawFaqModuleQuestions,
  makeRawFaqQuestionItem,
} from '@blog/service/testing/modules/fixtures';

import { resolveFaqs } from './resolve-faqs';

describe(resolveFaqs, () => {
  it('returns an empty array when the page has no FAQ module', () => {
    expect(resolveFaqs([])).toEqual([]);
  });

  it('flattens the questions of several modules in first-seen order', () => {
    const faqs = resolveFaqs([
      makeRawFaqModuleQuestions({
        questions: [makeRawFaqQuestionItem({ _id: 'block-faq-1' })],
      }),
      makeRawFaqModuleQuestions({
        questions: [makeRawFaqQuestionItem({ _id: 'block-faq-2' })],
      }),
    ]);

    expect(faqs.map(({ id }) => id)).toEqual(['block-faq-1', 'block-faq-2']);
  });

  it('turns the answer blocks into plain text', () => {
    const [faq] = resolveFaqs([makeRawFaqModuleQuestions()]);

    expect(faq).toEqual({
      id: 'block-faq-1',
      question: 'How long does onboarding take?',
      answer: 'Most teams are live within a week.',
    });
  });

  it('dedupes a question referenced by two modules, keeping its first occurrence', () => {
    const module = makeRawFaqModuleQuestions();

    expect(resolveFaqs([module, module])).toHaveLength(1);
  });

  it('drops a question with no text in either language', () => {
    const faqs = resolveFaqs([
      makeRawFaqModuleQuestions({
        questions: [
          makeRawFaqQuestionItem({
            _id: 'no-question',
            question: null as never,
          }),
          makeRawFaqQuestionItem({ _id: 'no-answer', answer: null as never }),
          makeRawFaqQuestionItem({ _id: 'empty-answer', answer: [] }),
        ],
      }),
    ]);

    expect(faqs).toEqual([]);
  });

  it('keeps a module whose questions are unset out of the list', () => {
    expect(
      resolveFaqs([makeRawFaqModuleQuestions({ questions: null })]),
    ).toEqual([]);
  });
});
