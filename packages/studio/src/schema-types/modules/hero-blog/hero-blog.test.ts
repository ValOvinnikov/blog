import {
  CTA_ACTION_VARIANT,
  HERO_IMAGE_SOURCE,
  POST_SOURCE,
  HERO_VARIANT,
} from '@blog/config/constants';
import { PAGE_POST_TYPE } from '@blog/studio/schema-types/documents/pages/post/post-type';
import { heroBlogSchema } from '@blog/studio/schema-types/modules/hero-blog/hero-blog';
import type { SanityDocument, ValidationContext } from 'sanity';

type TCustomFn = (
  value: unknown,
  context: { parent?: unknown },
) => string | true;

type THiddenFn = (context: { parent?: unknown }) => boolean;

type TDocFn = (
  document: SanityDocument | undefined,
  context: ValidationContext,
) => Promise<string | true> | string | true;

const getField = (name: string) => {
  const field = heroBlogSchema.fields?.find(
    (field): field is typeof field & { name: string } =>
      'name' in field && field.name === name,
  );

  if (!field) {
    throw new Error(`Expected heroBlogSchema to define a "${name}" field.`);
  }

  return field;
};

const getOptionValues = (field: { options?: unknown }) => {
  const options = field.options;
  const list =
    options && typeof options === 'object' && 'list' in options
      ? (options as { list: unknown }).list
      : undefined;

  if (!list) {
    throw new Error('Expected field to define an options.list.');
  }

  return (list as { title: string; value: string }[]).map(
    (option) => option.value,
  );
};

const getHidden = (field: { hidden?: unknown }): THiddenFn => {
  if (typeof field.hidden !== 'function') {
    throw new Error('Expected field to define a hidden() fn.');
  }

  return field.hidden as THiddenFn;
};

const getFieldCustomValidator = (field: {
  validation?: unknown;
}): TCustomFn => {
  if (!field.validation) {
    throw new Error('Expected field to define validation.');
  }

  let customFn: TCustomFn | undefined;

  const rule = {
    custom: (fn: TCustomFn) => {
      customFn = fn;
      return rule;
    },
    required: () => rule,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
  (field.validation as any)(rule);

  if (!customFn) {
    throw new Error('Expected field validation to register a custom() rule.');
  }

  return customFn;
};

type TDocValidator = { fn: TDocFn; level: 'error' | 'warning' };

const getDocumentValidators = (): TDocValidator[] => {
  const collected: TDocValidator[] = [];

  const rule = {
    custom: (fn: TDocFn) => {
      const record: TDocValidator = { fn, level: 'error' };
      collected.push(record);

      return {
        warning: () => {
          record.level = 'warning';
          return record;
        },
      };
    },
  };

  if (!heroBlogSchema.validation) {
    throw new Error('Expected heroBlogSchema to define document validation.');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
  (heroBlogSchema.validation as any)(rule);

  return collected;
};

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
  it('offers Pinned and Newest Featured, defaulting to Pinned', () => {
    const field = getField('postSource');

    expect(getOptionValues(field)).toEqual([
      POST_SOURCE.PINNED,
      POST_SOURCE.NEWEST_FEATURED,
    ]);
    expect(field.initialValue).toBe(POST_SOURCE.PINNED);
  });
});

describe('heroBlogSchema post field', () => {
  it('only accepts page_post references', () => {
    const field = getField('post') as { to?: { type: string }[] };

    expect(field.to).toEqual([{ type: PAGE_POST_TYPE }]);
  });

  it('is hidden unless Post Source is Pinned', () => {
    const hidden = getHidden(getField('post'));

    expect(hidden({ parent: { postSource: POST_SOURCE.PINNED } })).toBe(false);
    expect(
      hidden({ parent: { postSource: POST_SOURCE.NEWEST_FEATURED } }),
    ).toBe(true);
  });

  it('errors when Pinned with no post chosen', () => {
    const validate = getFieldCustomValidator(getField('post'));

    expect(
      validate(undefined, { parent: { postSource: POST_SOURCE.PINNED } }),
    ).toBe('Choose a post, or switch the source to Newest featured.');
  });

  it('is valid when Pinned with a post chosen', () => {
    const validate = getFieldCustomValidator(getField('post'));

    expect(
      validate(
        { _ref: 'post-1' },
        { parent: { postSource: POST_SOURCE.PINNED } },
      ),
    ).toBe(true);
  });

  it('is valid with no post when Post Source is Newest Featured', () => {
    const validate = getFieldCustomValidator(getField('post'));

    expect(
      validate(undefined, {
        parent: { postSource: POST_SOURCE.NEWEST_FEATURED },
      }),
    ).toBe(true);
  });
});

describe('heroBlogSchema copy fields', () => {
  it('eyebrow, heading and supportingText are plain optional fields', () => {
    expect(getField('eyebrow').validation).toBeDefined();
    expect(getField('heading').validation).toBeDefined();
    expect('hidden' in getField('eyebrow')).toBe(false);
    expect('hidden' in getField('heading')).toBe(false);
    expect('hidden' in getField('supportingText')).toBe(false);
  });
});

describe('heroBlogSchema imageSource field', () => {
  it('offers Post, Custom and None, defaulting to Post', () => {
    const field = getField('imageSource');

    expect(getOptionValues(field)).toEqual([
      HERO_IMAGE_SOURCE.POST,
      HERO_IMAGE_SOURCE.CUSTOM,
      HERO_IMAGE_SOURCE.NONE,
    ]);
    expect(field.initialValue).toBe(HERO_IMAGE_SOURCE.POST);
  });
});

describe('heroBlogSchema image field', () => {
  it('is hidden unless Image Source is Custom', () => {
    const hidden = getHidden(getField('image'));

    expect(hidden({ parent: { imageSource: HERO_IMAGE_SOURCE.CUSTOM } })).toBe(
      false,
    );
    expect(hidden({ parent: { imageSource: HERO_IMAGE_SOURCE.POST } })).toBe(
      true,
    );
    expect(hidden({ parent: { imageSource: HERO_IMAGE_SOURCE.NONE } })).toBe(
      true,
    );
  });

  it('errors when Custom with no image chosen', () => {
    const validate = getFieldCustomValidator(getField('image'));

    expect(
      validate(undefined, {
        parent: { imageSource: HERO_IMAGE_SOURCE.CUSTOM },
      }),
    ).toBe('Custom image is required when Image Source is Custom.');
  });

  it('is valid with no image when Image Source is Post or None', () => {
    const validate = getFieldCustomValidator(getField('image'));

    expect(
      validate(undefined, { parent: { imageSource: HERO_IMAGE_SOURCE.POST } }),
    ).toBe(true);
    expect(
      validate(undefined, { parent: { imageSource: HERO_IMAGE_SOURCE.NONE } }),
    ).toBe(true);
  });
});

describe('heroBlogSchema secondaryAction field', () => {
  it('is valid when unset', () => {
    const validate = getFieldCustomValidator(getField('secondaryAction'));

    expect(validate(undefined, { parent: {} })).toBe(true);
  });

  it('is valid with the Secondary variant', () => {
    const validate = getFieldCustomValidator(getField('secondaryAction'));

    expect(
      validate({ variant: CTA_ACTION_VARIANT.SECONDARY }, { parent: {} }),
    ).toBe(true);
  });

  it('errors with the Primary variant', () => {
    const validate = getFieldCustomValidator(getField('secondaryAction'));

    expect(
      validate({ variant: CTA_ACTION_VARIANT.PRIMARY }, { parent: {} }),
    ).toBe('Secondary Action must use the Secondary variant.');
  });
});

describe('heroBlogSchema document validation', () => {
  it('registers four document-level rules: two errors then two warnings', () => {
    const validators = getDocumentValidators();

    expect(validators.map((validator) => validator.level)).toEqual([
      'error',
      'error',
      'warning',
      'warning',
    ]);
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
        'No published post is marked Featured, so this hero would render empty.',
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

  describe('variant-requires-image', () => {
    it('errors when Split with Image Source None', () => {
      const [, validateVariantImage] = getDocumentValidators();

      expect(
        validateVariantImage!.fn(
          {
            variant: HERO_VARIANT.SPLIT,
            imageSource: HERO_IMAGE_SOURCE.NONE,
          } as unknown as SanityDocument,
          undefined as unknown as ValidationContext,
        ),
      ).toBe('These variants are built around an image.');
    });

    it('errors when Banner with Image Source None', () => {
      const [, validateVariantImage] = getDocumentValidators();

      expect(
        validateVariantImage!.fn(
          {
            variant: HERO_VARIANT.BANNER,
            imageSource: HERO_IMAGE_SOURCE.NONE,
          } as unknown as SanityDocument,
          undefined as unknown as ValidationContext,
        ),
      ).toBe('These variants are built around an image.');
    });

    it('passes when Stacked with Image Source None', () => {
      const [, validateVariantImage] = getDocumentValidators();

      expect(
        validateVariantImage!.fn(
          {
            variant: HERO_VARIANT.STACKED,
            imageSource: HERO_IMAGE_SOURCE.NONE,
          } as unknown as SanityDocument,
          undefined as unknown as ValidationContext,
        ),
      ).toBe(true);
    });

    it('passes when Split with an image source', () => {
      const [, validateVariantImage] = getDocumentValidators();

      expect(
        validateVariantImage!.fn(
          {
            variant: HERO_VARIANT.SPLIT,
            imageSource: HERO_IMAGE_SOURCE.POST,
          } as unknown as SanityDocument,
          undefined as unknown as ValidationContext,
        ),
      ).toBe(true);
    });
  });

  describe('pinned-post-publish-date', () => {
    it('passes without querying when Post Source is Newest Featured', async () => {
      const [, , validatePublishDate] = getDocumentValidators();
      let called = false;
      const context = createMockContext(() => {
        called = true;
        return null;
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

    it('warns when the pinned post publishes in the future', async () => {
      const [, , validatePublishDate] = getDocumentValidators();
      const future = new Date(Date.now() + 86_400_000).toISOString();
      const context = createMockContext(() => ({
        publishedAt: future,
        heroImage: undefined,
      }));

      await expect(
        validatePublishDate!.fn(
          {
            postSource: POST_SOURCE.PINNED,
            post: { _ref: 'post-1' },
          } as unknown as SanityDocument,
          context,
        ),
      ).resolves.toBe(
        'This post publishes later. The hero stays empty until then.',
      );
    });

    it('passes when the pinned post already published', async () => {
      const [, , validatePublishDate] = getDocumentValidators();
      const past = new Date(Date.now() - 86_400_000).toISOString();
      const context = createMockContext(() => ({
        publishedAt: past,
        heroImage: undefined,
      }));

      await expect(
        validatePublishDate!.fn(
          {
            postSource: POST_SOURCE.PINNED,
            post: { _ref: 'post-1' },
          } as unknown as SanityDocument,
          context,
        ),
      ).resolves.toBe(true);
    });
  });

  describe('post-image-fallback', () => {
    it('passes without querying when Image Source is not Post', async () => {
      const [, , , validateImageFallback] = getDocumentValidators();
      let called = false;
      const context = createMockContext(() => {
        called = true;
        return null;
      });

      await expect(
        validateImageFallback!.fn(
          {
            imageSource: HERO_IMAGE_SOURCE.CUSTOM,
          } as unknown as SanityDocument,
          context,
        ),
      ).resolves.toBe(true);
      expect(called).toBe(false);
    });

    it('queries page_post for the newest featured, published post', async () => {
      const [, , , validateImageFallback] = getDocumentValidators();
      let receivedQuery = '';
      const context = createMockContext((query) => {
        receivedQuery = query;
        return { publishedAt: null, heroImage: undefined };
      });

      await validateImageFallback!.fn(
        {
          postSource: POST_SOURCE.NEWEST_FEATURED,
          imageSource: HERO_IMAGE_SOURCE.POST,
        } as unknown as SanityDocument,
        context,
      );

      expect(receivedQuery).toBe(
        '*[_type == "page_post" && featured == true && publishedAt <= now() && defined(headingBlock.heading) && defined(author) && defined(topic) && defined(content) && defined(seo.metaTitle)] | order(publishedAt desc)[0]{ publishedAt, heroImage }',
      );
    });

    it('warns when Image Source is Post and the resolved post has no image', async () => {
      const [, , , validateImageFallback] = getDocumentValidators();
      const context = createMockContext(() => ({
        publishedAt: null,
        heroImage: undefined,
      }));

      await expect(
        validateImageFallback!.fn(
          {
            postSource: POST_SOURCE.NEWEST_FEATURED,
            imageSource: HERO_IMAGE_SOURCE.POST,
          } as unknown as SanityDocument,
          context,
        ),
      ).resolves.toBe('Falls back to no image on the page.');
    });

    it('passes when Image Source is Post and the resolved post has an image', async () => {
      const [, , , validateImageFallback] = getDocumentValidators();
      const context = createMockContext(() => ({
        publishedAt: null,
        heroImage: { asset: { _ref: 'image-abc' } },
      }));

      await expect(
        validateImageFallback!.fn(
          {
            postSource: POST_SOURCE.NEWEST_FEATURED,
            imageSource: HERO_IMAGE_SOURCE.POST,
          } as unknown as SanityDocument,
          context,
        ),
      ).resolves.toBe(true);
    });
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
