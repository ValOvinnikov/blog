import { PAGE_POST_TYPE } from '@blog/studio/schema-types/documents/pages/post/post-type';
import { heroSchema } from '@blog/studio/schema-types/modules/hero/hero';
import { getField } from '@blog/studio/testing/get-field';

describe('heroSchema featuredPost field', () => {
  it('only accepts page_post references', () => {
    const field = getField(heroSchema, 'featuredPost') as {
      to?: { type: string }[];
    };

    expect(field.to).toEqual([{ type: PAGE_POST_TYPE }]);
  });
});

describe('heroSchema deprecation', () => {
  it('carries a deprecated marker with a non-empty reason', () => {
    expect(heroSchema.deprecated?.reason).toBeTruthy();
  });
});
