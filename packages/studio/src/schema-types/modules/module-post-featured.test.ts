import { DISPLAY_MODE, POST_SOURCE } from '@blog/config/constants';
import { PAGE_POST_TYPE } from '@blog/studio/schema-types/documents/pages/page-post-type';
import { postFeaturedSchema } from '@blog/studio/schema-types/modules/module-post-featured';
import type { SanityDocument, ValidationContext } from 'sanity';

type THiddenFn = (context: { parent?: unknown }) => boolean;

type TDocFn = (
  document: SanityDocument | undefined,
  context: ValidationContext,
) => Promise<string | true> | string | true;

const getField = (name: string) => {
  const field = postFeaturedSchema.fields?.find(
    (field): field is typeof field & { name: string } =>
      'name' in field && field.name === name,
  );

  if (!field) {
    throw new Error(`Expected postFeaturedSchema to define a "${name}" field.`);
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

type TPostsValidatorProbe = {
  customFn: (
    value: unknown[] | undefined,
    context: { parent?: unknown },
  ) => string | true;
  uniqueCalled: boolean;
  maxCalledWith: number | undefined;
  maxErrorMessage: string | undefined;
};

const getPostsValidatorProbe = (): TPostsValidatorProbe => {
  const field = getField('posts');

  if (!field.validation) {
    throw new Error('Expected posts field to define validation.');
  }

  let uniqueCalled = false;
  let maxCalledWith: number | undefined;
  let maxErrorMessage: string | undefined;
  let customFn: TPostsValidatorProbe['customFn'] | undefined;

  const rule = {
    unique: () => {
      uniqueCalled = true;
      return rule;
    },
    max: (value: number) => {
      maxCalledWith = value;
      return rule;
    },
    error: (message: string) => {
      maxErrorMessage = message;
      return rule;
    },
    custom: (fn: TPostsValidatorProbe['customFn']) => {
      customFn = fn;
      return rule;
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
  (field.validation as any)(rule);

  if (!customFn) {
    throw new Error(
      'Expected posts field validation to register a custom() rule.',
    );
  }

  return { customFn, uniqueCalled, maxCalledWith, maxErrorMessage };
};

type TLimitValidatorProbe = {
  customFn: (
    value: number | undefined,
    context: { parent?: unknown },
  ) => string | true;
  integerCalled: boolean;
  minCalledWith: number | undefined;
  maxCalledWith: number | undefined;
};

const getLimitValidatorProbe = (): TLimitValidatorProbe => {
  const field = getField('limit');

  if (!field.validation) {
    throw new Error('Expected limit field to define validation.');
  }

  let integerCalled = false;
  let minCalledWith: number | undefined;
  let maxCalledWith: number | undefined;
  let customFn: TLimitValidatorProbe['customFn'] | undefined;

  const rule = {
    integer: () => {
      integerCalled = true;
      return rule;
    },
    min: (value: number) => {
      minCalledWith = value;
      return rule;
    },
    max: (value: number) => {
      maxCalledWith = value;
      return rule;
    },
    custom: (fn: TLimitValidatorProbe['customFn']) => {
      customFn = fn;
      return rule;
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
  (field.validation as any)(rule);

  if (!customFn) {
    throw new Error(
      'Expected limit field validation to register a custom() rule.',
    );
  }

  return { customFn, integerCalled, minCalledWith, maxCalledWith };
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

  if (!postFeaturedSchema.validation) {
    throw new Error(
      'Expected postFeaturedSchema to define document validation.',
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
  (postFeaturedSchema.validation as any)(rule);

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

describe('postFeaturedSchema displayMode field', () => {
  it('is emitted immediately after showImages', () => {
    const names =
      postFeaturedSchema.fields
        ?.map((field) => ('name' in field ? field.name : undefined))
        .filter((name): name is string => Boolean(name)) ?? [];
    const showImagesIndex = names.indexOf('showImages');
    const displayModeIndex = names.indexOf('displayMode');

    expect(showImagesIndex).toBeGreaterThanOrEqual(0);
    expect(displayModeIndex).toBe(showImagesIndex + 1);
  });

  it('defaults to GRID', () => {
    const field = getField('displayMode');

    expect(field.initialValue).toBe(DISPLAY_MODE.GRID);
  });

  it('defines no validation rule', () => {
    const field = getField('displayMode');

    expect(
      'validation' in field ? field.validation : undefined,
    ).toBeUndefined();
  });
});

describe('postFeaturedSchema postSource field', () => {
  it('offers Pinned and Newest Featured, defaulting to Pinned', () => {
    const field = getField('postSource');

    expect(getOptionValues(field)).toEqual([
      POST_SOURCE.PINNED,
      POST_SOURCE.NEWEST_FEATURED,
    ]);
    expect(field.initialValue).toBe(POST_SOURCE.PINNED);
  });
});

describe('postFeaturedSchema posts field', () => {
  it('only accepts page_post references', () => {
    const field = getField('posts') as {
      of?: { to?: { type: string }[] }[];
    };

    expect(field.of?.[0]?.to).toEqual([{ type: PAGE_POST_TYPE }]);
  });

  it('is hidden unless Post Source is Pinned', () => {
    const hidden = getHidden(getField('posts'));

    expect(hidden({ parent: { postSource: POST_SOURCE.PINNED } })).toBe(false);
    expect(
      hidden({ parent: { postSource: POST_SOURCE.NEWEST_FEATURED } }),
    ).toBe(true);
  });

  it('registers unique() and a max(3) rule with a clear message', () => {
    const { uniqueCalled, maxCalledWith, maxErrorMessage } =
      getPostsValidatorProbe();

    expect(uniqueCalled).toBe(true);
    expect(maxCalledWith).toBe(3);
    expect(maxErrorMessage).toBe('A spotlight holds at most three posts.');
  });

  it('errors when Pinned with no posts chosen', () => {
    const { customFn } = getPostsValidatorProbe();

    expect(
      customFn(undefined, { parent: { postSource: POST_SOURCE.PINNED } }),
    ).toBe('Pin at least one post, or switch the source to Newest featured.');
    expect(customFn([], { parent: { postSource: POST_SOURCE.PINNED } })).toBe(
      'Pin at least one post, or switch the source to Newest featured.',
    );
  });

  it('is valid when Pinned with at least one post chosen', () => {
    const { customFn } = getPostsValidatorProbe();

    expect(
      customFn([{ _ref: 'post-1' }], {
        parent: { postSource: POST_SOURCE.PINNED },
      }),
    ).toBe(true);
  });

  it('is valid with no posts when Post Source is Newest Featured', () => {
    const { customFn } = getPostsValidatorProbe();

    expect(
      customFn(undefined, {
        parent: { postSource: POST_SOURCE.NEWEST_FEATURED },
      }),
    ).toBe(true);
  });
});

describe('postFeaturedSchema limit field', () => {
  it('is hidden unless Post Source is Newest Featured', () => {
    const hidden = getHidden(getField('limit'));

    expect(
      hidden({ parent: { postSource: POST_SOURCE.NEWEST_FEATURED } }),
    ).toBe(false);
    expect(hidden({ parent: { postSource: POST_SOURCE.PINNED } })).toBe(true);
  });

  it('defaults to 3', () => {
    expect(getField('limit').initialValue).toBe(3);
  });

  it('registers integer(), min(1) and max(3)', () => {
    const { integerCalled, minCalledWith, maxCalledWith } =
      getLimitValidatorProbe();

    expect(integerCalled).toBe(true);
    expect(minCalledWith).toBe(1);
    expect(maxCalledWith).toBe(3);
  });

  it('errors when Newest Featured with no limit chosen', () => {
    const { customFn } = getLimitValidatorProbe();

    expect(
      customFn(undefined, {
        parent: { postSource: POST_SOURCE.NEWEST_FEATURED },
      }),
    ).toBe('Limit is required, or switch the source to Pinned.');
  });

  it('is valid when Newest Featured with a limit chosen', () => {
    const { customFn } = getLimitValidatorProbe();

    expect(
      customFn(3, { parent: { postSource: POST_SOURCE.NEWEST_FEATURED } }),
    ).toBe(true);
  });

  it('is valid with no limit when Post Source is Pinned', () => {
    const { customFn } = getLimitValidatorProbe();

    expect(
      customFn(undefined, { parent: { postSource: POST_SOURCE.PINNED } }),
    ).toBe(true);
  });
});

describe('postFeaturedSchema document validation', () => {
  it('registers two document-level rules: error then warning', () => {
    const validators = getDocumentValidators();

    expect(validators.map((validator) => validator.level)).toEqual([
      'error',
      'warning',
    ]);
  });

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

  it('shows the pinned post count when Post Source is Pinned', () => {
    if (!prepare) {
      throw new Error('Expected postFeaturedSchema to define preview.prepare.');
    }

    expect(
      prepare({
        title: 'Spotlight',
        postSource: POST_SOURCE.PINNED,
        posts: [{ _ref: 'post-1' }, { _ref: 'post-2' }],
        limit: undefined,
      }),
    ).toEqual({
      title: 'Spotlight',
      subtitle: 'Pinned: 2 posts',
    });
  });

  it('uses singular "post" for exactly one pinned post', () => {
    if (!prepare) {
      throw new Error('Expected postFeaturedSchema to define preview.prepare.');
    }

    expect(
      prepare({
        title: 'Spotlight',
        postSource: POST_SOURCE.PINNED,
        posts: [{ _ref: 'post-1' }],
        limit: undefined,
      }),
    ).toEqual({
      title: 'Spotlight',
      subtitle: 'Pinned: 1 post',
    });
  });

  it('shows the limit when Post Source is Newest Featured', () => {
    if (!prepare) {
      throw new Error('Expected postFeaturedSchema to define preview.prepare.');
    }

    expect(
      prepare({
        title: 'Spotlight',
        postSource: POST_SOURCE.NEWEST_FEATURED,
        posts: undefined,
        limit: 3,
      }),
    ).toEqual({
      title: 'Spotlight',
      subtitle: 'Newest featured (limit 3)',
    });
  });
});
