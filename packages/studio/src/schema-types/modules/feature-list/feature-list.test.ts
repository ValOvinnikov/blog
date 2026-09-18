import { CARD_IMAGE_SHAPE } from '@blog/config/constants';
import { featureListSchema } from '@blog/studio/schema-types/modules/feature-list/feature-list';

describe('featureListSchema preview', () => {
  const prepare = featureListSchema.preview?.prepare;

  if (!prepare) {
    throw new Error('Expected featureListSchema to define preview.prepare.');
  }

  it.each([
    [
      {
        title: 'Why choose us',
        brandVariant: 'PRIMARY',
        imageShape: CARD_IMAGE_SHAPE.WIDE,
      },
      { title: 'Why choose us', subtitle: 'Primary · Wide' },
    ],
    [
      { title: undefined, brandVariant: undefined, imageShape: undefined },
      { title: 'Unknown', subtitle: undefined },
    ],
  ])('prepares %j', (input, expected) => {
    expect(prepare(input)).toEqual(expected);
  });
});
