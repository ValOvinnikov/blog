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

describe('faqSchema preview', () => {
  const prepare = faqSchema.preview?.prepare;

  if (!prepare) {
    throw new Error('Expected faqSchema to define preview.prepare.');
  }

  it.each([
    [
      {
        title: 'Common Questions',
        brandVariant: 'PRIMARY',
        questions: [{ _ref: 'faq-1' }, { _ref: 'faq-2' }],
      },
      { title: 'Common Questions', subtitle: 'Primary · 2 questions' },
    ],
    [
      {
        title: 'Pricing',
        brandVariant: 'SECONDARY',
        questions: [{ _ref: 'faq-1' }],
      },
      { title: 'Pricing', subtitle: 'Secondary · 1 question' },
    ],
    [
      { title: undefined, brandVariant: undefined, questions: undefined },
      { title: 'Unknown', subtitle: '0 questions' },
    ],
  ])('prepares %j', (input, expected) => {
    expect(prepare(input)).toEqual(expected);
  });
});
