import { featureHighlightsSchema } from '@blog/studio/schema-types/modules/feature-highlights/feature-highlights';
import { getRecordedBounds } from '@blog/studio/testing/create-mock-validation-rule';

const highlightsField = featureHighlightsSchema.fields.find(
  (field) => field.name === 'highlights',
);

describe('featureHighlightsSchema highlights field', () => {
  it('requires at least two rows and caps at six', () => {
    expect(getRecordedBounds(highlightsField)).toEqual({
      required: true,
      min: 2,
      max: 6,
    });
  });
});
