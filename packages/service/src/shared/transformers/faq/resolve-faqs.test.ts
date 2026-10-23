import {
  MOCK_FAQ_QUESTION_ID,
  MOCK_SECOND_FAQ_QUESTION_ID,
  mockFaqView,
  mockRawFaqModuleQuestions,
  mockRawFaqQuestionItem,
} from '@blog/service/testing/modules/fixtures';

import { resolveFaqs } from './resolve-faqs';

describe(resolveFaqs, () => {
  it('returns an empty array when the page has no FAQ module', () => {
    const faqs = resolveFaqs([]);

    expect(faqs).toEqual([]);
  });

  it('flattens the questions of several modules in first-seen order', () => {
    const faqs = resolveFaqs([
      mockRawFaqModuleQuestions({
        questions: [mockRawFaqQuestionItem({ _id: MOCK_FAQ_QUESTION_ID })],
      }),
      mockRawFaqModuleQuestions({
        questions: [
          mockRawFaqQuestionItem({ _id: MOCK_SECOND_FAQ_QUESTION_ID }),
        ],
      }),
    ]);

    expect(faqs.map(({ id }) => id)).toEqual([
      MOCK_FAQ_QUESTION_ID,
      MOCK_SECOND_FAQ_QUESTION_ID,
    ]);
  });

  it('turns the answer blocks into plain text', () => {
    const [faq] = resolveFaqs([mockRawFaqModuleQuestions()]);

    expect(faq).toEqual(mockFaqView());
  });

  it('dedupes a question referenced by two modules, keeping its first occurrence', () => {
    const module = mockRawFaqModuleQuestions();

    const faqs = resolveFaqs([module, module]);

    expect(faqs).toHaveLength(1);
  });

  it('drops a question with no text in either language', () => {
    const faqs = resolveFaqs([
      mockRawFaqModuleQuestions({
        questions: [
          mockRawFaqQuestionItem({
            _id: 'no-question',
            question: null as never,
          }),
          mockRawFaqQuestionItem({ _id: 'no-answer', answer: null as never }),
          mockRawFaqQuestionItem({ _id: 'empty-answer', answer: [] }),
        ],
      }),
    ]);

    expect(faqs).toEqual([]);
  });

  it('keeps a module whose questions are unset out of the list', () => {
    const faqs = resolveFaqs([mockRawFaqModuleQuestions({ questions: null })]);

    expect(faqs).toEqual([]);
  });
});
