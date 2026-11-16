import { faker } from '@faker-js/faker';
import { BRAND_VARIANT, CONTENT_ALIGNMENT } from '@shinefold/config';
import { mockRawFaqModule } from '@shinefold/service/testing/modules/faq/fixtures';
import {
  mockCtaButtonView,
  mockRawContentBlock,
  mockRawCtaButton,
  mockRawFaqQuestionItem,
} from '@shinefold/service/testing/modules/fixtures';
import { MOCK_AUTHORED_CARD_APPEARANCE } from '@shinefold/service/testing/shared/module-appearance';

import { toFaqModule } from './transformer';

faker.seed(8);

const MOCK_FIRST_QUESTION_ID = faker.string.uuid();
const MOCK_SECOND_QUESTION_ID = faker.string.uuid();
const MOCK_QUESTION = {
  _id: faker.string.uuid(),
  question: faker.lorem.sentence(),
};
const MOCK_ANSWER = faker.lorem.sentence();

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

  it('leaves every appearance override undefined when unset', () => {
    const module = toFaqModule(mockRawFaqModule());

    expect(module).toMatchObject({
      cardStyle: undefined,
      radiusScale: undefined,
      density: undefined,
    });
  });

  it('maps the authored appearance overrides straight through', () => {
    const module = toFaqModule(mockRawFaqModule(MOCK_AUTHORED_CARD_APPEARANCE));

    expect(module).toMatchObject(MOCK_AUTHORED_CARD_APPEARANCE);
  });

  it('keeps the questions in authored order', () => {
    const raw = mockRawFaqModule({
      questions: [
        mockRawFaqQuestionItem({ _id: MOCK_FIRST_QUESTION_ID }),
        mockRawFaqQuestionItem({ _id: MOCK_SECOND_QUESTION_ID }),
      ],
    });

    const module = toFaqModule(raw);

    expect(module.questions.map((question) => question.id)).toEqual([
      MOCK_FIRST_QUESTION_ID,
      MOCK_SECOND_QUESTION_ID,
    ]);
  });

  it('maps a dereferenced question to its id, text and rich-text answer', () => {
    const answer = [mockRawContentBlock({ text: MOCK_ANSWER })];
    const raw = mockRawFaqModule({
      questions: [mockRawFaqQuestionItem({ ...MOCK_QUESTION, answer })],
    });

    const module = toFaqModule(raw);

    const [question] = module.questions;
    expect(question?.id).toBe(MOCK_QUESTION._id);
    expect(question?.question).toBe(MOCK_QUESTION.question);
    expect(question?.answer[0]?.children?.[0]?.text).toBe(MOCK_ANSWER);
  });

  it('maps authored ctaButtons', () => {
    const raw = mockRawFaqModule({ ctaButtons: [mockRawCtaButton()] });

    const module = toFaqModule(raw);

    expect(module.ctaButtons).toEqual([mockCtaButtonView()]);
  });
});
