import { faqSchema } from '@blog/studio/schema-types/modules/faq/faq';
import { getRecordedBounds } from '@blog/studio/testing/create-mock-validation-rule';
import { getField } from '@blog/studio/testing/get-field';

describe('faqSchema questions field validation', () => {
  it('is required, unique and bounded to two through twenty references', () => {
    const questionsField = getField(faqSchema, 'questions');

    expect(getRecordedBounds(questionsField)).toEqual({
      required: true,
      unique: true,
      min: 2,
      max: 20,
    });
  });
});
