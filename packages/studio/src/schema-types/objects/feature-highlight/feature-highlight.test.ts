import { featureHighlightSchema } from '@blog/studio/schema-types/objects/feature-highlight/feature-highlight';
import { getRecordedBounds } from '@blog/studio/testing/create-mock-validation-rule';

const fieldByName = (name: string) =>
  featureHighlightSchema.fields.find((field) => field.name === name);

describe('featureHighlightSchema', () => {
  it('requires a heading', () => {
    expect(getRecordedBounds(fieldByName('heading'))).toEqual({
      required: true,
    });
  });

  it('requires body text', () => {
    expect(getRecordedBounds(fieldByName('body'))).toEqual({
      required: true,
    });
  });

  it('requires an image', () => {
    expect(getRecordedBounds(fieldByName('image'))).toEqual({
      required: true,
    });
  });
});
