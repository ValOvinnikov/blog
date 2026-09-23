import { statsSchema } from '@blog/studio/schema-types/modules/stats/stats';
import { getRecordedBounds } from '@blog/studio/testing/create-mock-validation-rule';
import { getField } from '@blog/studio/testing/get-field';

describe('statsSchema stats field validation', () => {
  it('is required and bounded to two through six figures', () => {
    const statsField = getField(statsSchema, 'stats');

    expect(getRecordedBounds(statsField)).toEqual({
      required: true,
      min: 2,
      max: 6,
    });
  });
});

describe('statsSchema footnote field validation', () => {
  it('is bounded to a maximum of 160 characters', () => {
    const footnoteField = getField(statsSchema, 'footnote');

    expect(getRecordedBounds(footnoteField)).toEqual({
      max: 160,
    });
  });
});
