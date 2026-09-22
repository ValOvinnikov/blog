import { POST_SOURCE } from '@blog/config/constants';
import { heroBlogSchema } from '@blog/studio/schema-types/modules/hero-blog/hero-blog';
import { getCustomValidator } from '@blog/studio/testing/create-mock-validation-rule';
import { getField } from '@blog/studio/testing/get-field';
import { getHidden } from '@blog/studio/testing/get-field-hidden';
import type { ValidationContext } from 'sanity';

type TCustomFn = (
  value: unknown,
  context: { parent?: unknown },
) => string | true;

type TFieldAsyncFn = (
  value: string | undefined,
  context: ValidationContext,
) => Promise<string | true>;

const getHeroBlogField = (name: string) => getField(heroBlogSchema, name);

const createMockContext = (
  fetchImpl: (query: string, params?: unknown) => unknown,
): ValidationContext => {
  const getClient = () => ({
    withConfig: () => ({
      fetch: async (query: string, params?: unknown) =>
        fetchImpl(query, params),
    }),
  });

  return { getClient } as unknown as ValidationContext;
};

describe('heroBlogSchema postSource field', () => {
  describe('newest-featured-has-candidate', () => {
    it('passes without querying when Post Source is Pinned', async () => {
      const validate = getCustomValidator<TFieldAsyncFn>(
        getHeroBlogField('postSource'),
      );
      let called = false;
      const context = createMockContext(() => {
        called = true;
        return 0;
      });

      await expect(validate(POST_SOURCE.PINNED, context)).resolves.toBe(true);
      expect(called).toBe(false);
    });

    it('errors when Newest Featured and no candidate exists', async () => {
      const validate = getCustomValidator<TFieldAsyncFn>(
        getHeroBlogField('postSource'),
      );
      const context = createMockContext(() => 0);

      await expect(
        validate(POST_SOURCE.NEWEST_FEATURED, context),
      ).resolves.toBe(
        'No published post is marked Featured, so this hero would render empty.',
      );
    });

    it('passes when Newest Featured and a candidate exists', async () => {
      const validate = getCustomValidator<TFieldAsyncFn>(
        getHeroBlogField('postSource'),
      );
      const context = createMockContext(() => 1);

      await expect(
        validate(POST_SOURCE.NEWEST_FEATURED, context),
      ).resolves.toBe(true);
    });
  });
});

describe('heroBlogSchema post field', () => {
  it('is hidden unless Post Source is Pinned', () => {
    const hidden = getHidden(getHeroBlogField('post'));

    expect(hidden({ parent: { postSource: POST_SOURCE.PINNED } })).toBe(false);
    expect(
      hidden({ parent: { postSource: POST_SOURCE.NEWEST_FEATURED } }),
    ).toBe(true);
  });

  it('errors when Pinned with no post chosen', () => {
    const validate = getCustomValidator<TCustomFn>(getHeroBlogField('post'));

    expect(
      validate(undefined, { parent: { postSource: POST_SOURCE.PINNED } }),
    ).toBe('Choose a post, or switch the source to Newest featured.');
  });

  it('is valid when Pinned with a post chosen', () => {
    const validate = getCustomValidator<TCustomFn>(getHeroBlogField('post'));

    expect(
      validate(
        { _ref: 'post-1' },
        { parent: { postSource: POST_SOURCE.PINNED } },
      ),
    ).toBe(true);
  });

  it('is valid with no post when Post Source is Newest Featured', () => {
    const validate = getCustomValidator<TCustomFn>(getHeroBlogField('post'));

    expect(
      validate(undefined, {
        parent: { postSource: POST_SOURCE.NEWEST_FEATURED },
      }),
    ).toBe(true);
  });
});

describe('heroBlogSchema preview', () => {
  it('shows the pinned post title when Post Source is Pinned', () => {
    const prepare = heroBlogSchema.preview?.prepare;

    if (!prepare) {
      throw new Error('Expected heroBlogSchema to define preview.prepare.');
    }

    expect(
      prepare({
        title: 'My Hero',
        postSource: POST_SOURCE.PINNED,
        postTitle: 'Some Post',
      }),
    ).toEqual({
      title: 'My Hero',
      subtitle: 'Pinned: Some Post',
    });
  });

  it('shows a generic subtitle when Post Source is Newest Featured', () => {
    const prepare = heroBlogSchema.preview?.prepare;

    if (!prepare) {
      throw new Error('Expected heroBlogSchema to define preview.prepare.');
    }

    expect(
      prepare({
        title: 'My Hero',
        postSource: POST_SOURCE.NEWEST_FEATURED,
        postTitle: undefined,
      }),
    ).toEqual({
      title: 'My Hero',
      subtitle: 'Newest featured post',
    });
  });
});
