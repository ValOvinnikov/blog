import {
  HERO_IMAGE_SOURCE,
  POST_SOURCE,
  HERO_VARIANT,
} from '@blog/config/constants';
import { heroBlogSchema } from '@blog/studio/schema-types/modules/hero-blog/hero-blog';
import {
  getCustomValidator,
  getRecordedValidators,
  type TRecordedValidator,
} from '@blog/studio/testing/create-mock-validation-rule';
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

const getLayout = (field: { options?: unknown }) => {
  const options = field.options;

  return options && typeof options === 'object' && 'layout' in options
    ? (options as { layout?: string }).layout
    : undefined;
};

const getFieldset = (field: { fieldset?: unknown }) =>
  field.fieldset as string | undefined;

const getHidden = (field: { hidden?: unknown }): THiddenFn => {
  if (typeof field.hidden !== 'function') {
    throw new Error('Expected field to define a hidden() fn.');
  }

  return field.hidden as THiddenFn;
};

const wasRequiredCalled = (field: { validation?: unknown }) => {
  if (!field.validation) {
    throw new Error('Expected field to define validation.');
  }

  let requiredCalled = false;
  const rule = {
    required: () => {
      requiredCalled = true;
      return rule;
    },
    max: () => rule,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
  (field.validation as any)(rule);

  return requiredCalled;
};

const getFieldCustomValidator = (field: { validation?: unknown }): TCustomFn =>
  getCustomValidator<TCustomFn>(field);

const getDocumentValidators = (): TRecordedValidator<TDocFn>[] =>
  getRecordedValidators<TDocFn>(heroBlogSchema);

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
  it('is a required dropdown in the post fieldset, and drives the post field', () => {
    const field = getField('postSource');

    expect(getLayout(field)).toBe('dropdown');
    expect(wasRequiredCalled(field)).toBe(true);
    expect(getFieldset(field)).toBe('post');
  });
});

describe('heroBlogSchema post field', () => {
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

  it('is valid when Pinned with a post chosen, or when Post Source is Newest Featured', () => {
    const validate = getFieldCustomValidator(getField('post'));

    expect(
      validate(
        { _ref: 'post-1' },
        { parent: { postSource: POST_SOURCE.PINNED } },
      ),
    ).toBe(true);
    expect(
      validate(undefined, {
        parent: { postSource: POST_SOURCE.NEWEST_FEATURED },
      }),
    ).toBe(true);
  });
});

describe('heroBlogSchema copy fields', () => {
  it('has no heading or supportingText fields', () => {
    expect(
      heroBlogSchema.fields?.find(
        (field) => 'name' in field && field.name === 'heading',
      ),
    ).toBeUndefined();
    expect(
      heroBlogSchema.fields?.find(
        (field) => 'name' in field && field.name === 'supportingText',
      ),
    ).toBeUndefined();
  });
});

describe('heroBlogSchema imageSource field', () => {
  it('is a required radio in the image fieldset, and drives the image field', () => {
    const field = getField('imageSource');

    expect(getLayout(field)).toBe('radio');
    expect(wasRequiredCalled(field)).toBe(true);
    expect(getFieldset(field)).toBe('image');
  });
});

describe('heroBlogSchema primaryActionLabel field', () => {
  it('is required — the hero has no fallback label', () => {
    expect(wasRequiredCalled(getField('primaryActionLabel'))).toBe(true);
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
    ).toBe('A custom image is required when Source is Custom.');
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
  it('has no ctaButtons field left over', () => {
    expect(
      heroBlogSchema.fields?.find(
        (field) => 'name' in field && field.name === 'ctaButtons',
      ),
    ).toBeUndefined();
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
    it('errors when Split or Banner has Image Source None', () => {
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

    it('passes when Stacked has Image Source None, or Split has an image source', () => {
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
