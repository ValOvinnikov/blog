import { tagSchema } from '@blog/studio/schema-types/documents/blog/tag/tag';
import { tagPageSchema } from '@blog/studio/schema-types/documents/pages/tag/tag';
import { HERO_SCHEMA_TYPES } from '@blog/studio/schema-types/modules';
import { postLatestSchema } from '@blog/studio/schema-types/modules/post-latest/post-latest';
import { postListSchema } from '@blog/studio/schema-types/modules/post-list/post-list';
import { PAGE_HEADING_DESCRIPTION } from '@blog/studio/schema-types/objects/heading-block/heading-block-field';
import type { ValidationContext } from 'sanity';

type TReferenceFieldDefinition = {
  type: 'reference';
  to?: Array<{ type?: string }>;
  validation?: unknown;
  readOnly?: boolean;
  deprecated?: { reason: string };
};

type TArrayFieldDefinition = {
  type: 'array';
  of?: Array<{ name?: string }>;
};

type TValidationRule = {
  required: () => TValidationRule;
  custom: (fn: unknown) => TValidationRule;
};

const getField = (name: string) =>
  tagPageSchema.fields?.find((field) => field.name === name);

describe('tagPageSchema field order', () => {
  it('orders fields title, slug, tag, headingBlock, hero, modules, seo', () => {
    expect(tagPageSchema.fields?.map((field) => field.name)).toEqual([
      'title',
      'slug',
      'tag',
      'headingBlock',
      'hero',
      'modules',
      'seo',
    ]);
  });
});

describe('tagPageSchema shape', () => {
  it('title is required via the shared titleField() helper', () => {
    const titleFieldDefinition = getField('title');

    if (!titleFieldDefinition?.validation) {
      throw new Error('Expected tagPageSchema to define a title field.');
    }

    let requiredCalled = false;
    const rule: TValidationRule = {
      required: () => {
        requiredCalled = true;
        return rule;
      },
      custom: () => rule,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    (titleFieldDefinition.validation as any)(rule);

    expect(requiredCalled).toBe(true);
  });

  it('title description tells the editor it also seeds the slug', () => {
    const titleFieldDefinition = getField('title');

    expect(titleFieldDefinition?.description).toBe(
      'Give this document a clear, descriptive title to help identify it in Studio. This title also is used to automatically generate the slug. This title for internal use only',
    );
  });

  it('no longer defines a postList field', () => {
    expect(getField('postList')).toBeUndefined();
  });

  it('modules allows module_postList, module_postLatest, module_cta, and module_newsletter', () => {
    const modulesField = getField('modules') as
      TArrayFieldDefinition | undefined;

    if (!modulesField || modulesField.type !== 'array' || !modulesField.of) {
      throw new Error('Expected tagPageSchema to define a modules field.');
    }

    expect(modulesField.of.map((member) => member.name)).toEqual([
      'module_postList',
      'module_postLatest',
      'module_cta',
      'module_newsletter',
    ]);
  });

  it('seo is required via the shared seoField() helper', () => {
    const seoFieldDefinition = getField('seo');

    if (!seoFieldDefinition?.validation) {
      throw new Error('Expected tagPageSchema to define a seo field.');
    }

    let requiredCalled = false;
    const rule: TValidationRule = {
      required: () => {
        requiredCalled = true;
        return rule;
      },
      custom: () => rule,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    (seoFieldDefinition.validation as any)(rule);

    expect(requiredCalled).toBe(true);
  });
});

type THeadingBlockFieldDefinition = {
  type: string;
  description?: string;
};

type THeadingBlockCustomFn = (
  value: { heading?: string } | undefined,
) => string | true;

describe('pageTagSchema headingBlock field', () => {
  it('is built via headingBlockField() with a page-scoped description', () => {
    const headingBlockField = getField('headingBlock') as
      THeadingBlockFieldDefinition | undefined;

    expect(headingBlockField?.type).toBe('headingBlock');
    expect(headingBlockField?.description).toBe(PAGE_HEADING_DESCRIPTION);
  });

  it('is required at the field level', () => {
    const headingBlockField = getField('headingBlock') as
      { validation?: unknown } | undefined;

    if (!headingBlockField?.validation) {
      throw new Error(
        'Expected pageTagSchema headingBlock to define validation.',
      );
    }

    let customFn: THeadingBlockCustomFn | undefined;
    const rule = {
      custom: (fn: THeadingBlockCustomFn) => {
        customFn = fn;
        return rule;
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    (headingBlockField.validation as any)(rule);

    if (!customFn) {
      throw new Error(
        'Expected pageTagSchema headingBlock validation to register a custom() rule.',
      );
    }

    expect(customFn(undefined)).toBe('Heading is required.');
    expect(customFn({ heading: 'Design' })).toBe(true);
  });
});

describe('tagPageSchema hero field', () => {
  it('is an optional reference to the hero family via heroField()', () => {
    const heroField = getField('hero') as
      | { type: string; to?: Array<{ type: string }>; validation?: unknown }
      | undefined;

    if (!heroField) {
      throw new Error('Expected tagPageSchema to define a hero field.');
    }

    expect(heroField.type).toBe('reference');
    expect(heroField.to?.map((entry) => entry.type)).toEqual(
      HERO_SCHEMA_TYPES.map((schema) => schema.name),
    );
    expect(heroField.validation).toBeUndefined();
  });
});

type TSlugFieldDefinition = {
  type: 'slug';
  options?: {
    source?: string;
    maxLength?: number;
    isUnique?: unknown;
  };
  components?: { input?: unknown };
  validation?: unknown;
};

describe('tagPageSchema slug field', () => {
  const getSlugField = () =>
    getField('slug') as TSlugFieldDefinition | undefined;

  it('is sourced from title with a 96-char max', () => {
    const slugField = getSlugField();

    if (!slugField || slugField.type !== 'slug') {
      throw new Error('Expected tagPageSchema to define a slug field.');
    }

    expect(slugField.options?.source).toBe('title');
    expect(slugField.options?.maxLength).toBe(96);
  });

  it('is required', () => {
    const slugField = getSlugField();

    if (!slugField?.validation) {
      throw new Error(
        'Expected tagPageSchema slug field to define validation.',
      );
    }

    let requiredCalled = false;
    const rule: TValidationRule = {
      required: () => {
        requiredCalled = true;
        return rule;
      },
      custom: () => rule,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    (slugField.validation as any)(rule);

    expect(requiredCalled).toBe(true);
  });

  it('relies on the default per-document-type isUnique scope rather than overriding it', () => {
    // /tags/{slug} collisions only matter within page_tag itself, which is
    // exactly Sanity's default slug uniqueness scope — no custom `isUnique`
    // is needed on top of it.
    const slugField = getSlugField();

    expect(slugField?.options?.isUnique).toBeUndefined();
  });

  it('renders the shared URL-preview input', () => {
    const slugField = getSlugField();

    expect(typeof slugField?.components?.input).toBe('function');
  });
});

describe('tagPageSchema tag field', () => {
  const getTagField = () =>
    getField('tag') as TReferenceFieldDefinition | undefined;

  it('references blog_tag', () => {
    const tagField = getTagField();

    if (!tagField || tagField.type !== 'reference') {
      throw new Error(
        'Expected tagPageSchema to define a tag reference field.',
      );
    }

    expect(tagField.to?.map((target) => target.type)).toEqual([tagSchema.name]);
  });

  it('is required', () => {
    const tagField = getTagField();

    if (!tagField?.validation) {
      throw new Error('Expected tagPageSchema tag field to define validation.');
    }

    let requiredCalled = false;
    const rule: TValidationRule = {
      required: () => {
        requiredCalled = true;
        return rule;
      },
      custom: () => rule,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    (tagField.validation as any)(rule);

    expect(requiredCalled).toBe(true);
  });
});

type TReferenceValue = { _ref?: string } | undefined;
type TCustomFn = (
  value: TReferenceValue,
  context: ValidationContext,
) => Promise<string | true>;

const TAG_UNIQUENESS_ERROR =
  'Another Tag Page already references this tag — each tag can only back one Tag Page.';

/**
 * `validateUniqueTagReference` is private to tag.ts; the `tag` field's
 * `validation` builder registers it via `rule.custom(fn)`, so a minimal
 * chainable mock rule captures it the same way home.test.ts captures
 * its modules-field custom validator — no export needed.
 */
const getUniqueTagValidator = (): TCustomFn => {
  const tagField = tagPageSchema.fields?.find((field) => field.name === 'tag');

  if (!tagField?.validation) {
    throw new Error('Expected tag field validation to register custom().');
  }

  let customFn: TCustomFn | undefined;

  const rule = {
    required: () => rule,
    custom: (fn: TCustomFn) => {
      customFn = fn;
      return rule;
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
  (tagField.validation as any)(rule);

  if (!customFn) {
    throw new Error('Expected tag field validation to register custom().');
  }

  return customFn;
};

const createMockContext = (fetchResult: unknown, documentId = 'page-tag-1') => {
  const fetchCalls: { query: string; params: unknown }[] = [];
  const withConfigCalls: unknown[] = [];

  const getClient = () => ({
    withConfig: (config: unknown) => {
      withConfigCalls.push(config);

      return {
        fetch: async (query: string, params: unknown) => {
          fetchCalls.push({ query, params });
          return fetchResult;
        },
      };
    },
  });

  const context = {
    getClient,
    document: { _id: documentId },
  } as unknown as ValidationContext;

  return { context, fetchCalls, withConfigCalls };
};

describe('validateUniqueTagReference', () => {
  it('passes without querying when no reference is set', async () => {
    const validate = getUniqueTagValidator();
    const { context, fetchCalls } = createMockContext(0);

    await expect(validate(undefined, context)).resolves.toBe(true);
    expect(fetchCalls).toHaveLength(0);
  });

  it('passes when no other page_tag references the same tag', async () => {
    const validate = getUniqueTagValidator();
    const { context } = createMockContext(0);

    await expect(validate({ _ref: 'tag-1' }, context)).resolves.toBe(true);
  });

  it('flags a conflicting page_tag referencing the same tag', async () => {
    const validate = getUniqueTagValidator();
    const { context } = createMockContext(1);

    await expect(validate({ _ref: 'tag-1' }, context)).resolves.toBe(
      TAG_UNIQUENESS_ERROR,
    );
  });

  it('excludes both the draft and published id of the current document', async () => {
    const validate = getUniqueTagValidator();
    const { context, fetchCalls } = createMockContext(0, 'drafts.page-tag-1');

    await validate({ _ref: 'tag-1' }, context);

    expect(fetchCalls[0]?.params).toEqual({
      type: 'page_tag',
      tagId: 'tag-1',
      publishedId: 'page-tag-1',
    });
  });

  it('requests the drafts perspective so an unpublished conflict still counts', async () => {
    const validate = getUniqueTagValidator();
    const { context, withConfigCalls } = createMockContext(0);

    await validate({ _ref: 'tag-1' }, context);

    expect(withConfigCalls).toEqual([{ perspective: 'drafts' }]);
  });
});

type TDocumentCustomFn = (
  document: Record<string, unknown>,
  context: ValidationContext,
) => string | true | Promise<string | true>;

type TDocumentMockRule = {
  level: 'error' | 'warning';
  fn?: TDocumentCustomFn;
  custom: (fn: TDocumentCustomFn) => TDocumentMockRule;
  warning: () => TDocumentMockRule;
};

const createDocumentMockRule = (
  level: TDocumentMockRule['level'] = 'error',
  fn?: TDocumentCustomFn,
): TDocumentMockRule => ({
  level,
  fn,
  custom: (nextFn) => createDocumentMockRule('error', nextFn),
  warning: () => createDocumentMockRule('warning', fn),
});

const buildDocumentRules = (): TDocumentMockRule[] => {
  if (!tagPageSchema.validation) {
    throw new Error('Expected tagPageSchema to define a validation rule.');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
  return (tagPageSchema.validation as any)(
    createDocumentMockRule(),
  ) as TDocumentMockRule[];
};

describe('pageTagSchema document validation — modules[] post list count', () => {
  it('errors when more than one module_postList is referenced', () => {
    const [singlePostListRule] = buildDocumentRules();

    expect(singlePostListRule?.level).toBe('error');
    expect(
      singlePostListRule?.fn?.(
        {
          modules: [
            { _type: postListSchema.name, _ref: 'list-1' },
            { _type: postListSchema.name, _ref: 'list-2' },
          ],
        },
        {} as ValidationContext,
      ),
    ).toBe('Only one Post List module is allowed per page.');
  });

  it('passes with exactly one module_postList reference', () => {
    const [singlePostListRule, hasPostListRule] = buildDocumentRules();

    const document = {
      modules: [
        { _type: postListSchema.name, _ref: 'list-1' },
        { _type: postLatestSchema.name, _ref: 'latest-1' },
      ],
    };

    expect(singlePostListRule?.fn?.(document, {} as ValidationContext)).toBe(
      true,
    );
    expect(hasPostListRule?.fn?.(document, {} as ValidationContext)).toBe(true);
  });

  it('warns when no module_postList is referenced', () => {
    const [, hasPostListRule] = buildDocumentRules();

    expect(hasPostListRule?.level).toBe('warning');
    expect(
      hasPostListRule?.fn?.(
        { modules: [{ _type: postLatestSchema.name, _ref: 'latest-1' }] },
        {} as ValidationContext,
      ),
    ).toBe(
      'This page has no Post List module — the archive will be empty until one is added.',
    );
  });

  it('warns when modules is undefined', () => {
    const [, hasPostListRule] = buildDocumentRules();

    expect(hasPostListRule?.fn?.({}, {} as ValidationContext)).toBe(
      'This page has no Post List module — the archive will be empty until one is added.',
    );
  });
});

const POST_LIST_UNIQUENESS_ERROR =
  'Another Tag Page already references this Post List — each Post List can only back one Tag Page.';

describe('tagPageSchema document validation — unique post list reference', () => {
  it('passes without querying when modules[] carries no post list reference', async () => {
    const [, , uniquePostListRule] = buildDocumentRules();
    const { context, fetchCalls } = createMockContext(0);

    await expect(uniquePostListRule?.fn?.({}, context)).resolves.toBe(true);
    expect(fetchCalls).toHaveLength(0);
  });

  it('reads the reference from modules[] when present', async () => {
    const [, , uniquePostListRule] = buildDocumentRules();
    const { context, fetchCalls } = createMockContext(0);

    await uniquePostListRule?.fn?.(
      {
        _id: 'page-tag-1',
        modules: [{ _type: postListSchema.name, _ref: 'post-list-1' }],
      },
      context,
    );

    expect(fetchCalls[0]?.params).toMatchObject({ postListId: 'post-list-1' });
  });

  it('flags a conflicting page_tag referencing the same modules[] post list', async () => {
    const [, , uniquePostListRule] = buildDocumentRules();
    const { context } = createMockContext(1);

    await expect(
      uniquePostListRule?.fn?.(
        {
          _id: 'page-tag-1',
          modules: [{ _type: postListSchema.name, _ref: 'post-list-1' }],
        },
        context,
      ),
    ).resolves.toBe(POST_LIST_UNIQUENESS_ERROR);
  });

  it('excludes both the draft and published id of the current document', async () => {
    const [, , uniquePostListRule] = buildDocumentRules();
    const { context, fetchCalls } = createMockContext(0, 'drafts.page-tag-1');

    await uniquePostListRule?.fn?.(
      {
        _id: 'drafts.page-tag-1',
        modules: [{ _type: postListSchema.name, _ref: 'post-list-1' }],
      },
      context,
    );

    expect(fetchCalls[0]?.params).toEqual({
      type: 'page_tag',
      postListId: 'post-list-1',
      publishedId: 'page-tag-1',
    });
  });

  it('requests the drafts perspective so an unpublished conflict still counts', async () => {
    const [, , uniquePostListRule] = buildDocumentRules();
    const { context, withConfigCalls } = createMockContext(0);

    await uniquePostListRule?.fn?.(
      {
        _id: 'page-tag-1',
        modules: [{ _type: postListSchema.name, _ref: 'post-list-1' }],
      },
      context,
    );

    expect(withConfigCalls).toEqual([{ perspective: 'drafts' }]);
  });
});
