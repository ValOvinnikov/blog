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

    expect(faqs).toEqual([
      mockFaqView(),
      { ...mockFaqView(), id: MOCK_SECOND_FAQ_QUESTION_ID },
    ]);
  });

  it('dedupes a question referenced by two modules, keeping one occurrence', () => {
    const module = mockRawFaqModuleQuestions();

    const faqs = resolveFaqs([module, module]);

    expect(faqs).toEqual([mockFaqView()]);
  });

  it.each([
    {
      missing: 'its question',
      question: mockRawFaqQuestionItem({ question: null as never }),
    },
    {
      missing: 'its answer',
      question: mockRawFaqQuestionItem({ answer: null as never }),
    },
    {
      missing: 'any answer block',
      question: mockRawFaqQuestionItem({ answer: [] }),
    },
  ])('drops a question missing $missing', ({ question }) => {
    const faqs = resolveFaqs([
      mockRawFaqModuleQuestions({ questions: [question] }),
    ]);

    expect(faqs).toEqual([]);
  });

  it('keeps a module whose questions are unset out of the list', () => {
    const faqs = resolveFaqs([mockRawFaqModuleQuestions({ questions: null })]);

    expect(faqs).toEqual([]);
  });
});
