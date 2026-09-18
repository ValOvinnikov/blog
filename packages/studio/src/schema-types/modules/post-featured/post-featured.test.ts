import {
  BRAND_VARIANT,
  DISPLAY_MODE,
  POST_SOURCE,
} from '@blog/config/constants';
import { postFeaturedSchema } from '@blog/studio/schema-types/modules/post-featured/post-featured';
import {
  getRecordedValidators,
  type TRecordedValidator,
} from '@blog/studio/testing/create-mock-validation-rule';
import { getField } from '@blog/studio/testing/get-field';
import { getHidden } from '@blog/studio/testing/get-field-hidden';
import type { SanityDocument, ValidationContext } from 'sanity';

type TDocFn = (
  document: SanityDocument | undefined,
  context: ValidationContext,
) => Promise<string | true> | string | true;

const getPostFeaturedField = (name: string) =>
  getField(postFeaturedSchema, name);

type TCustomProbe<TValue> = (
  value: TValue,
  context: { parent?: unknown },
) => string | true;

const getCustomFn = <TValue>(fieldName: string): TCustomProbe<TValue> => {
  const field = getPostFeaturedField(fieldName);

  if (!field.validation) {
    throw new Error(`Expected "${fieldName}" field to define validation.`);
  }

  let customFn: TCustomProbe<TValue> | undefined;
  const rule = {
    unique: () => rule,
    integer: () => rule,
    min: () => rule,
    max: () => rule,
    error: () => rule,
    custom: (fn: TCustomProbe<TValue>) => {
      customFn = fn;
      return rule;
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
  (field.validation as any)(rule);

  if (!customFn) {
    throw new Error(
      `Expected "${fieldName}" field validation to register a custom() rule.`,
    );
  }

  return customFn;
};

const getDocumentValidators = (): TRecordedValidator<TDocFn>[] =>
  getRecordedValidators<TDocFn>(postFeaturedSchema);

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

describe('postFeaturedSchema posts field', () => {
  it('is hidden unless Post Source is Pinned', () => {
    const hidden = getHidden(getPostFeaturedField('posts'));

    expect(hidden({ parent: { postSource: POST_SOURCE.PINNED } })).toBe(false);
    expect(
      hidden({ parent: { postSource: POST_SOURCE.NEWEST_FEATURED } }),
    ).toBe(true);
  });

  it.each([
    [undefined, POST_SOURCE.PINNED],
    [[], POST_SOURCE.PINNED],
  ])('errors when Pinned with no posts chosen (%j)', (value, postSource) => {
    const customFn = getCustomFn<unknown[] | undefined>('posts');

    expect(customFn(value, { parent: { postSource } })).toBe(
      'Pin at least one post, or switch the source to Newest featured.',
    );
  });

  it('is valid when Pinned with at least one post chosen', () => {
    const customFn = getCustomFn<unknown[] | undefined>('posts');

    expect(
      customFn([{ _ref: 'post-1' }], {
        parent: { postSource: POST_SOURCE.PINNED },
      }),
    ).toBe(true);
  });

  it('is valid with no posts when Post Source is Newest Featured', () => {
    const customFn = getCustomFn<unknown[] | undefined>('posts');

    expect(
      customFn(undefined, {
        parent: { postSource: POST_SOURCE.NEWEST_FEATURED },
      }),
    ).toBe(true);
  });
});

describe('postFeaturedSchema limit field', () => {
  it('is hidden unless Post Source is Newest Featured', () => {
    const hidden = getHidden(getPostFeaturedField('limit'));

    expect(
      hidden({ parent: { postSource: POST_SOURCE.NEWEST_FEATURED } }),
    ).toBe(false);
    expect(hidden({ parent: { postSource: POST_SOURCE.PINNED } })).toBe(true);
  });

  it('errors when Newest Featured with no limit chosen', () => {
    const customFn = getCustomFn<number | undefined>('limit');

    expect(
      customFn(undefined, {
        parent: { postSource: POST_SOURCE.NEWEST_FEATURED },
      }),
    ).toBe('Limit is required, or switch the source to Pinned.');
  });

  it('is valid when Newest Featured with a limit chosen', () => {
    const customFn = getCustomFn<number | undefined>('limit');

    expect(
      customFn(3, { parent: { postSource: POST_SOURCE.NEWEST_FEATURED } }),
    ).toBe(true);
  });

  it('is valid with no limit when Post Source is Pinned', () => {
    const customFn = getCustomFn<number | undefined>('limit');

    expect(
      customFn(undefined, { parent: { postSource: POST_SOURCE.PINNED } }),
    ).toBe(true);
  });
});

describe('postFeaturedSchema document validation', () => {
  it('defines no carousel/limit warning, unlike postLatestSchema', async () => {
    const validators = getDocumentValidators();

    for (const validator of validators) {
      await expect(
        validator.fn(
          {
            displayMode: DISPLAY_MODE.CAROUSEL,
            postSource: POST_SOURCE.NEWEST_FEATURED,
            limit: 1,
          } as unknown as SanityDocument,
          createMockContext(() => 1),
        ),
      ).resolves.toBe(true);
    }
  });

  describe('newest-featured-has-candidate', () => {
    it('passes without querying when Post Source is Pinned', async () => {
      const [validateNewestFeatured] = getDocumentValidators();
      let called = false;
      const context = createMockContext(() => {
        called = true;
        return 0;
      });

      await expect(
        validateNewestFeatured!.fn(
          { postSource: POST_SOURCE.PINNED } as unknown as SanityDocument,
          context,
        ),
      ).resolves.toBe(true);
      expect(called).toBe(false);
    });

    it('errors when Newest Featured and no candidate exists', async () => {
      const [validateNewestFeatured] = getDocumentValidators();
      const context = createMockContext(() => 0);

      await expect(
        validateNewestFeatured!.fn(
          {
            postSource: POST_SOURCE.NEWEST_FEATURED,
          } as unknown as SanityDocument,
          context,
        ),
      ).resolves.toBe(
        'No published post is marked Featured, so this spotlight would render empty.',
      );
    });

    it('passes when Newest Featured and a candidate exists', async () => {
      const [validateNewestFeatured] = getDocumentValidators();
      const context = createMockContext(() => 1);

      await expect(
        validateNewestFeatured!.fn(
          {
            postSource: POST_SOURCE.NEWEST_FEATURED,
          } as unknown as SanityDocument,
          context,
        ),
      ).resolves.toBe(true);
    });
  });

  describe('pinned-posts-publish-date', () => {
    it('passes without querying when Post Source is Newest Featured', async () => {
      const [, validatePublishDate] = getDocumentValidators();
      let called = false;
      const context = createMockContext(() => {
        called = true;
        return [];
      });

      await expect(
        validatePublishDate!.fn(
          {
            postSource: POST_SOURCE.NEWEST_FEATURED,
          } as unknown as SanityDocument,
          context,
        ),
      ).resolves.toBe(true);
      expect(called).toBe(false);
    });

    it('passes without querying when Pinned with no posts chosen yet', async () => {
      const [, validatePublishDate] = getDocumentValidators();
      let called = false;
      const context = createMockContext(() => {
        called = true;
        return [];
      });

      await expect(
        validatePublishDate!.fn(
          {
            postSource: POST_SOURCE.PINNED,
            posts: [],
          } as unknown as SanityDocument,
          context,
        ),
      ).resolves.toBe(true);
      expect(called).toBe(false);
    });

    it('warns when a pinned post publishes in the future', async () => {
      const [, validatePublishDate] = getDocumentValidators();
      const future = new Date(Date.now() + 86_400_000).toISOString();
      const context = createMockContext(() => [{ publishedAt: future }]);

      await expect(
        validatePublishDate!.fn(
          {
            postSource: POST_SOURCE.PINNED,
            posts: [{ _ref: 'post-1' }],
          } as unknown as SanityDocument,
          context,
        ),
      ).resolves.toBe(
        'This post publishes later. The spotlight skips it until then.',
      );
    });

    it('passes when every pinned post already published', async () => {
      const [, validatePublishDate] = getDocumentValidators();
      const past = new Date(Date.now() - 86_400_000).toISOString();
      const context = createMockContext(() => [{ publishedAt: past }]);

      await expect(
        validatePublishDate!.fn(
          {
            postSource: POST_SOURCE.PINNED,
            posts: [{ _ref: 'post-1' }],
          } as unknown as SanityDocument,
          context,
        ),
      ).resolves.toBe(true);
    });
  });
});

describe('postFeaturedSchema preview', () => {
  const prepare = postFeaturedSchema.preview?.prepare;

  if (!prepare) {
    throw new Error('Expected postFeaturedSchema to define preview.prepare.');
  }

  it.each([
    [
      {
        title: 'Spotlight',
        brandVariant: BRAND_VARIANT.SECONDARY,
        postSource: POST_SOURCE.PINNED,
        posts: [{ _ref: 'post-1' }, { _ref: 'post-2' }],
        limit: undefined,
      },
      { title: 'Spotlight', subtitle: 'Secondary · Pinned: 2 posts' },
    ],
    [
      {
        title: 'Spotlight',
        brandVariant: undefined,
        postSource: POST_SOURCE.PINNED,
        posts: [{ _ref: 'post-1' }],
        limit: undefined,
      },
      { title: 'Spotlight', subtitle: 'Pinned: 1 post' },
    ],
    [
      {
        title: 'Spotlight',
        brandVariant: BRAND_VARIANT.PRIMARY,
        postSource: POST_SOURCE.NEWEST_FEATURED,
        posts: undefined,
        limit: 3,
      },
      { title: 'Spotlight', subtitle: 'Primary · Newest featured (limit 3)' },
    ],
  ])('prepares %j', (input, expected) => {
    expect(prepare(input)).toEqual(expected);
  });
});
