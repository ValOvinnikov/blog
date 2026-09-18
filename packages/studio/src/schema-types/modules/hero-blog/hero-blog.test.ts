import {
  CTA_ACTION_APPEARANCE,
  HERO_IMAGE_SOURCE,
  POST_SOURCE,
  HERO_VARIANT,
} from '@blog/config/constants';
import { PAGE_POST_TYPE } from '@blog/studio/schema-types/documents/pages/post/post-type';
import { heroBlogSchema } from '@blog/studio/schema-types/modules/hero-blog/hero-blog';
import { ctaSecondaryButtonSchema } from '@blog/studio/schema-types/objects/cta-button/cta-button';
import {
  getCustomValidator,
  getRecordedValidators,
  type TRecordedValidator,
} from '@blog/studio/testing/create-mock-validation-rule';
import { getField } from '@blog/studio/testing/get-field';
import { getFieldset } from '@blog/studio/testing/get-field-fieldset';
import { getHidden } from '@blog/studio/testing/get-field-hidden';
import { getLayout } from '@blog/studio/testing/get-field-layout';
import { wasRequiredCalled } from '@blog/studio/testing/was-required-called';
import type { SanityDocument, ValidationContext } from 'sanity';

type TCustomFn = (
  value: unknown,
  context: { parent?: unknown },
) => string | true;

type TDocFn = (
  document: SanityDocument | undefined,
  context: ValidationContext,
) => Promise<string | true> | string | true;

const getHeroBlogField = (name: string) => getField(heroBlogSchema, name);

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

describe('heroBlogSchema fieldsets', () => {
  it('declares post, image, primaryAction and the shared content position fieldset', () => {
    const names = heroBlogSchema.fieldsets?.map((fieldset) => fieldset.name);

    expect(names).toEqual([
      'post',
      'image',
      'primaryAction',
      'contentPosition',
    ]);
  });
});

describe('heroBlogSchema postSource field', () => {
  it('offers Pinned and Newest Featured, defaulting to Newest Featured', () => {
    const field = getHeroBlogField('postSource');

    expect(getOptionValues(field)).toEqual([
      POST_SOURCE.PINNED,
      POST_SOURCE.NEWEST_FEATURED,
    ]);
    expect(field.initialValue).toBe(POST_SOURCE.NEWEST_FEATURED);
  });

  it('is a required dropdown in the post fieldset, and drives the post field', () => {
    const field = getHeroBlogField('postSource');

    expect(getLayout(field)).toBe('dropdown');
    expect(wasRequiredCalled(field)).toBe(true);
    expect(getFieldset(field)).toBe('post');
  });
});

describe('heroBlogSchema post field', () => {
  it('only accepts page_post references, in the post fieldset', () => {
    const field = getHeroBlogField('post') as {
      to?: { type: string }[];
      fieldset?: string;
    };

    expect(field.to).toEqual([{ type: PAGE_POST_TYPE }]);
    expect(getFieldset(field)).toBe('post');
  });

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

describe('heroBlogSchema copy fields', () => {
  it('eyebrow is a plain optional field with no fieldset', () => {
    expect(getHeroBlogField('eyebrow').validation).toBeUndefined();
    expect('hidden' in getHeroBlogField('eyebrow')).toBe(false);
    expect(getFieldset(getHeroBlogField('eyebrow'))).toBeUndefined();
  });

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
  it('offers Post, Custom and None, defaulting to Post', () => {
    const field = getHeroBlogField('imageSource');

    expect(getOptionValues(field)).toEqual([
      HERO_IMAGE_SOURCE.POST,
      HERO_IMAGE_SOURCE.CUSTOM,
      HERO_IMAGE_SOURCE.NONE,
    ]);
    expect(field.initialValue).toBe(HERO_IMAGE_SOURCE.POST);
  });

  it('is a required radio in the image fieldset, and drives the image field', () => {
    const field = getHeroBlogField('imageSource');

    expect(getLayout(field)).toBe('radio');
    expect(wasRequiredCalled(field)).toBe(true);
    expect(getFieldset(field)).toBe('image');
  });
});

describe('heroBlogSchema primaryActionLabel and primaryActionAppearance fields', () => {
  it('are both in the primaryAction fieldset', () => {
    expect(getFieldset(getHeroBlogField('primaryActionLabel'))).toBe(
      'primaryAction',
    );
    expect(getFieldset(getHeroBlogField('primaryActionAppearance'))).toBe(
      'primaryAction',
    );
  });

  it('primaryActionAppearance offers Contained and Inline, defaulting to Contained', () => {
    const field = getHeroBlogField('primaryActionAppearance');

    expect(getOptionValues(field)).toEqual([
      CTA_ACTION_APPEARANCE.CONTAINED,
      CTA_ACTION_APPEARANCE.INLINE,
    ]);
    expect(field.initialValue).toBe(CTA_ACTION_APPEARANCE.CONTAINED);
  });

  it('primaryActionAppearance renders as a required dropdown', () => {
    const field = getHeroBlogField('primaryActionAppearance');

    expect(getLayout(field)).toBe('dropdown');
    expect(wasRequiredCalled(field)).toBe(true);
  });

  it('primaryActionLabel is required — the hero has no fallback label', () => {
    expect(wasRequiredCalled(getHeroBlogField('primaryActionLabel'))).toBe(
      true,
    );
  });
});

describe('heroBlogSchema image field', () => {
  it('is in the image fieldset and hidden unless Image Source is Custom', () => {
    const field = getHeroBlogField('image');
    const hidden = getHidden(field);

    expect(getFieldset(field)).toBe('image');
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
    const validate = getCustomValidator<TCustomFn>(getHeroBlogField('image'));

    expect(
      validate(undefined, {
        parent: { imageSource: HERO_IMAGE_SOURCE.CUSTOM },
      }),
    ).toBe('A custom image is required when Source is Custom.');
  });

  it('is valid with no image when Image Source is Post or None', () => {
    const validate = getCustomValidator<TCustomFn>(getHeroBlogField('image'));

    expect(
      validate(undefined, { parent: { imageSource: HERO_IMAGE_SOURCE.POST } }),
    ).toBe(true);
    expect(
      validate(undefined, { parent: { imageSource: HERO_IMAGE_SOURCE.NONE } }),
    ).toBe(true);
  });
});

describe('heroBlogSchema secondaryAction field', () => {
  it('uses the fixed-Secondary ctaSecondaryButton object type', () => {
    const field = getHeroBlogField('secondaryAction') as { type: string };

    expect(field.type).toBe(ctaSecondaryButtonSchema.name);
  });

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
