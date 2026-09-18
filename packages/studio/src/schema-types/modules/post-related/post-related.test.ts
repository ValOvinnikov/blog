import { BRAND_VARIANT } from '@blog/config/constants';
import { postRelatedSchema } from '@blog/studio/schema-types/modules/post-related/post-related';

describe('postRelatedSchema preview', () => {
  const prepare = postRelatedSchema.preview?.prepare;

  if (!prepare) {
    throw new Error('Expected postRelatedSchema to define preview.prepare.');
  }

  it.each([
    [
      {
        title: 'Related reading',
        brandVariant: BRAND_VARIANT.PRIMARY,
        limit: 3,
      },
      { title: 'Related reading', subtitle: 'Primary · Limit: 3' },
    ],
    [
      { title: undefined, brandVariant: undefined, limit: undefined },
      { title: 'Unknown', subtitle: undefined },
    ],
  ])('prepares %j', (input, expected) => {
    expect(prepare(input)).toEqual(expected);
  });
});
