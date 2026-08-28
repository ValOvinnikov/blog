import { postSchema } from '@blog/studio/schema-types/documents/blog/post';
import { pagePostSchema } from '@blog/studio/schema-types/documents/pages/page-post';
import type { ValidationContext } from 'sanity';

type TReferenceFieldDefinition = {
  type: 'reference';
  to?: Array<{ type?: string }>;
  validation?: unknown;
};

type TValidationRule = {
  required: () => TValidationRule;
  custom: (fn: unknown) => TValidationRule;
};

const getField = (name: string) =>
  pagePostSchema.fields?.find((field) => field.name === name);

describe('pagePostSchema shape', () => {
  it('title is required via the shared titleField() helper', () => {
    const titleFieldDefinition = getField('title');

    if (!titleFieldDefinition?.validation) {
      throw new Error('Expected pagePostSchema to define a title field.');
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

  it('publishedAt is a required datetime field', () => {
    const publishedAtField = getField('publishedAt') as
      { type: string; validation?: unknown } | undefined;

    if (!publishedAtField || publishedAtField.type !== 'datetime') {
      throw new Error(
        'Expected pagePostSchema to define a publishedAt datetime field.',
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
    (publishedAtField.validation as any)(rule);

    expect(requiredCalled).toBe(true);
  });

  it('has no postList or modules slot', () => {
    expect(getField('postList')).toBeUndefined();
    expect(getField('modules')).toBeUndefined();
  });

  it('seo stays optional — no validation() builder attached', () => {
    expect(getField('seo')?.validation).toBeUndefined();
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

describe('pagePostSchema slug field', () => {
  const getSlugField = () =>
    getField('slug') as TSlugFieldDefinition | undefined;

  it('is sourced from title with a 96-char max', () => {
    const slugField = getSlugField();

    if (!slugField || slugField.type !== 'slug') {
      throw new Error('Expected pagePostSchema to define a slug field.');
    }

    expect(slugField.options?.source).toBe('title');
    expect(slugField.options?.maxLength).toBe(96);
  });

  it('is required', () => {
    const slugField = getSlugField();

    if (!slugField?.validation) {
      throw new Error(
        'Expected pagePostSchema slug field to define validation.',
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
    // /blog/{slug} collisions only matter within page_post itself, which is
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

describe('pagePostSchema post field', () => {
  const getPostField = () =>
    getField('post') as TReferenceFieldDefinition | undefined;

  it('references blog_post', () => {
    const postField = getPostField();

    if (!postField || postField.type !== 'reference') {
      throw new Error(
        'Expected pagePostSchema to define a post reference field.',
      );
    }

    expect(postField.to?.map((target) => target.type)).toEqual([
      postSchema.name,
    ]);
  });

  it('is required', () => {
    const postField = getPostField();

    if (!postField?.validation) {
      throw new Error(
        'Expected pagePostSchema post field to define validation.',
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
    (postField.validation as any)(rule);

    expect(requiredCalled).toBe(true);
  });
});

type TReferenceValue = { _ref?: string } | undefined;
type TCustomFn = (
  value: TReferenceValue,
  context: ValidationContext,
) => Promise<string | true>;

const UNIQUENESS_ERROR =
  'Another Post Page already references this post — each post can only back one Post Page.';

/**
 * `validateUniquePostReference` is private to page-post.ts; the `post`
 * field's `validation` builder registers it via `rule.custom(fn)`, so a
 * minimal chainable mock rule captures it the same way page-topic.test.ts
 * captures its topic-field custom validator — no export needed.
 */
const getUniquePostValidator = (): TCustomFn => {
  const postField = pagePostSchema.fields?.find(
    (field) => field.name === 'post',
  );

  if (!postField?.validation) {
    throw new Error(
      'Expected pagePostSchema to define a post field with validation.',
    );
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
  (postField.validation as any)(rule);

  if (!customFn) {
    throw new Error('Expected post field validation to register custom().');
  }

  return customFn;
};

const createMockContext = (
  conflictingCount: number,
  documentId = 'page-post-1',
) => {
  const fetchCalls: { query: string; params: unknown }[] = [];
  const withConfigCalls: unknown[] = [];

  const getClient = () => ({
    withConfig: (config: unknown) => {
      withConfigCalls.push(config);

      return {
        fetch: async (query: string, params: unknown) => {
          fetchCalls.push({ query, params });
          return conflictingCount;
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

describe('validateUniquePostReference', () => {
  it('passes without querying when no reference is set', async () => {
    const validate = getUniquePostValidator();
    const { context, fetchCalls } = createMockContext(0);

    await expect(validate(undefined, context)).resolves.toBe(true);
    expect(fetchCalls).toHaveLength(0);
  });

  it('passes when no other page_post references the same post', async () => {
    const validate = getUniquePostValidator();
    const { context } = createMockContext(0);

    await expect(validate({ _ref: 'post-1' }, context)).resolves.toBe(true);
  });

  it('flags a conflicting page_post referencing the same post', async () => {
    const validate = getUniquePostValidator();
    const { context } = createMockContext(1);

    await expect(validate({ _ref: 'post-1' }, context)).resolves.toBe(
      UNIQUENESS_ERROR,
    );
  });

  it('excludes both the draft and published id of the current document', async () => {
    const validate = getUniquePostValidator();
    const { context, fetchCalls } = createMockContext(0, 'drafts.page-post-1');

    await validate({ _ref: 'post-1' }, context);

    expect(fetchCalls[0]?.params).toEqual({
      type: 'page_post',
      postId: 'post-1',
      publishedId: 'page-post-1',
    });
  });

  it('requests the drafts perspective so an unpublished conflict still counts', async () => {
    const validate = getUniquePostValidator();
    const { context, withConfigCalls } = createMockContext(0);

    await validate({ _ref: 'post-1' }, context);

    expect(withConfigCalls).toEqual([{ perspective: 'drafts' }]);
  });
});
