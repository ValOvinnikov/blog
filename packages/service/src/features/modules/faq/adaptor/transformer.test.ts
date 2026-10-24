import { BRAND_VARIANT, CONTENT_ALIGNMENT } from '@blog/config';
import {
  mockCtaButtonView,
  mockRawCtaButton,
  mockRawFaqModule,
  mockRawFaqQuestionItem,
} from '@blog/service/testing/modules/fixtures';

import { toFaqModule } from './transformer';

const FIRST_QUESTION_ID = 'question-b';
const SECOND_QUESTION_ID = 'question-a';
const PRICING_QUESTION = {
  _id: 'question-pricing',
  question: 'How much does it cost?',
};

describe(toFaqModule, () => {
  it('maps brandVariant straight through', () => {
    const raw = mockRawFaqModule({ brandVariant: BRAND_VARIANT.SECONDARY });

    const module = toFaqModule(raw);

    expect(module.brandVariant).toBe(BRAND_VARIANT.SECONDARY);
  });

  it.each([
    [null, undefined],
    [CONTENT_ALIGNMENT.CENTER, CONTENT_ALIGNMENT.CENTER],
  ])('maps contentAlignment %s to %s', (contentAlignment, expected) => {
    const raw = mockRawFaqModule({ contentAlignment });

    const module = toFaqModule(raw);

    expect(module.contentAlignment).toBe(expected);
  });

  it('keeps the questions in authored order', () => {
    const raw = mockRawFaqModule({
      questions: [
        mockRawFaqQuestionItem({ _id: FIRST_QUESTION_ID }),
        mockRawFaqQuestionItem({ _id: SECOND_QUESTION_ID }),
      ],
    });

    const module = toFaqModule(raw);

    expect(module.questions.map((question) => question.id)).toEqual([
      FIRST_QUESTION_ID,
      SECOND_QUESTION_ID,
    ]);
  });

  it('maps a dereferenced question to its id, question text and rich-text answer', () => {
    const raw = mockRawFaqModule({
      questions: [mockRawFaqQuestionItem(PRICING_QUESTION)],
    });

    const module = toFaqModule(raw);

    expect(module.questions[0]).toMatchObject({
      id: PRICING_QUESTION._id,
      question: PRICING_QUESTION.question,
    });
    expect(module.questions[0]?.answer[0]?.children?.[0]?.text).toBe(
      'Most teams are live within a week.',
    );
  });

  it('maps authored ctaButtons', () => {
    const raw = mockRawFaqModule({ ctaButtons: [mockRawCtaButton()] });

    const module = toFaqModule(raw);

    expect(module.ctaButtons).toHaveLength(1);
    expect(module.ctaButtons[0]).toEqual(mockCtaButtonView());
  });
});
