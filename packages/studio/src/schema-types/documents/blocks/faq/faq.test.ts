import { faqBlockSchema } from '@blog/studio/schema-types/documents/blocks/faq/faq';
import { getRecordedBounds } from '@blog/studio/testing/create-mock-validation-rule';
import { getField } from '@blog/studio/testing/get-field';

describe('faqBlockSchema question field validation', () => {
  it('is required', () => {
    const questionField = getField(faqBlockSchema, 'question');

    expect(getRecordedBounds(questionField)).toEqual({ required: true });
  });
});

describe('faqBlockSchema answer field validation', () => {
  it('is required', () => {
    const answerField = getField(faqBlockSchema, 'answer');

    expect(getRecordedBounds(answerField)).toEqual({ required: true });
  });
});
