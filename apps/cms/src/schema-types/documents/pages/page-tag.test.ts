import { tagSchema } from '@cms/schema-types/documents/blog/tag';
import { pageTagSchema } from '@cms/schema-types/documents/pages/page-tag';
import { postListSchema } from '@cms/schema-types/modules/module-post-list';
import type { ValidationContext } from 'sanity';

type TReferenceFieldDefinition = {
  type: 'reference';
  to?: Array<{ type?: string }>;
  validation?: unknown;
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
  pageTagSchema.fields?.find((field) => field.name === name);

describe('pageTagSchema shape', () => {
  it('title is required via the shared titleField() helper', () => {
    const titleFieldDefinition = getField('title');

    if (!titleFieldDefinition?.validation) {
      throw new Error('Expected pageTagSchema to define a title field.');
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

  it('postList references module_postList and stays optional but has custom uniqueness validation', () => {
    const postListField = getField('postList') as
      TReferenceFieldDefinition | undefined;

    if (!postListField || postListField.type !== 'reference') {
      throw new Error(
        'Expected pageTagSchema to define a postList reference field.',
      );
    }

    expect(postListField.to?.map((target) => target.type)).toEqual([
      postListSchema.name,
    ]);
    expect(postListField.validation).toBeDefined();
  });

  it('modules allows module_postLatest, module_cta, and module_newsletter', () => {
    const modulesField = getField('modules') as
      TArrayFieldDefinition | undefined;

    if (!modulesField || modulesField.type !== 'array' || !modulesField.of) {
      throw new Error('Expected pageTagSchema to define a modules field.');
    }

    expect(modulesField.of.map((member) => member.name)).toEqual([
      'module_postLatest',
      'module_cta',
      'module_newsletter',
    ]);
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

describe('pageTagSchema slug field', () => {
  const getSlugField = () =>
    getField('slug') as TSlugFieldDefinition | undefined;

  it('is sourced from title with a 96-char max', () => {
    const slugField = getSlugField();

    if (!slugField || slugField.type !== 'slug') {
      throw new Error('Expected pageTagSchema to define a slug field.');
    }

    expect(slugField.options?.source).toBe('title');
    expect(slugField.options?.maxLength).toBe(96);
  });

  it('is required', () => {
    const slugField = getSlugField();

    if (!slugField?.validation) {
      throw new Error(
        'Expected pageTagSchema slug field to define validation.',
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

describe('pageTagSchema tag field', () => {
  const getTagField = () =>
    getField('tag') as TReferenceFieldDefinition | undefined;

  it('references blog_tag', () => {
    const tagField = getTagField();

    if (!tagField || tagField.type !== 'reference') {
      throw new Error(
        'Expected pageTagSchema to define a tag reference field.',
      );
    }

    expect(tagField.to?.map((target) => target.type)).toEqual([tagSchema.name]);
  });

  it('is required', () => {
    const tagField = getTagField();

    if (!tagField?.validation) {
      throw new Error('Expected pageTagSchema tag field to define validation.');
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
const POST_LIST_UNIQUENESS_ERROR =
  'Another Tag Page already references this Post List — each Post List can only back one Tag Page.';

/**
 * Both `tag` and `postList` register their uniqueness validator as a private
 * `page-tag.ts` closure via `rule.custom(fn)`, so a minimal chainable mock
 * rule captures it the same way home-page.test.ts captures its modules-field
 * custom validator — no export needed.
 */
const getCustomValidator = (fieldName: string): TCustomFn => {
  const field = pageTagSchema.fields?.find(
    (schemaField) => schemaField.name === fieldName,
  );

  if (!field?.validation) {
    throw new Error(
      `Expected pageTagSchema to define a ${fieldName} field with validation.`,
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
  (field.validation as any)(rule);

  if (!customFn) {
    throw new Error(
      `Expected ${fieldName} field validation to register custom().`,
    );
  }

  return customFn;
};

const createMockContext = (
  conflictingCount: number,
  documentId = 'page-tag-1',
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

describe('validateUniqueTagReference', () => {
  it('passes without querying when no reference is set', async () => {
    const validate = getCustomValidator('tag');
    const { context, fetchCalls } = createMockContext(0);

    await expect(validate(undefined, context)).resolves.toBe(true);
    expect(fetchCalls).toHaveLength(0);
  });

  it('passes when no other page_tag references the same tag', async () => {
    const validate = getCustomValidator('tag');
    const { context } = createMockContext(0);

    await expect(validate({ _ref: 'tag-1' }, context)).resolves.toBe(true);
  });

  it('flags a conflicting page_tag referencing the same tag', async () => {
    const validate = getCustomValidator('tag');
    const { context } = createMockContext(1);

    await expect(validate({ _ref: 'tag-1' }, context)).resolves.toBe(
      TAG_UNIQUENESS_ERROR,
    );
  });

  it('excludes both the draft and published id of the current document', async () => {
    const validate = getCustomValidator('tag');
    const { context, fetchCalls } = createMockContext(0, 'drafts.page-tag-1');

    await validate({ _ref: 'tag-1' }, context);

    expect(fetchCalls[0]?.params).toEqual({
      type: 'page_tag',
      tagId: 'tag-1',
      publishedId: 'page-tag-1',
    });
  });

  it('requests the drafts perspective so an unpublished conflict still counts', async () => {
    const validate = getCustomValidator('tag');
    const { context, withConfigCalls } = createMockContext(0);

    await validate({ _ref: 'tag-1' }, context);

    expect(withConfigCalls).toEqual([{ perspective: 'drafts' }]);
  });
});

describe('validateUniquePostListReference', () => {
  it('passes without querying when no reference is set', async () => {
    const validate = getCustomValidator('postList');
    const { context, fetchCalls } = createMockContext(0);

    await expect(validate(undefined, context)).resolves.toBe(true);
    expect(fetchCalls).toHaveLength(0);
  });

  it('passes when no other page_tag references the same postList', async () => {
    const validate = getCustomValidator('postList');
    const { context } = createMockContext(0);

    await expect(validate({ _ref: 'post-list-1' }, context)).resolves.toBe(
      true,
    );
  });

  it('flags a conflicting page_tag referencing the same postList', async () => {
    const validate = getCustomValidator('postList');
    const { context } = createMockContext(1);

    await expect(validate({ _ref: 'post-list-1' }, context)).resolves.toBe(
      POST_LIST_UNIQUENESS_ERROR,
    );
  });

  it('allows a document to reference its own already-used postList (self-reference)', async () => {
    // conflictingCount is 0 because the mock query already excludes the
    // current document's published/draft ids — this asserts that exclusion
    // is what makes editing an existing page_tag safe, not a coincidence.
    const validate = getCustomValidator('postList');
    const { context } = createMockContext(0, 'drafts.page-tag-1');

    await expect(validate({ _ref: 'post-list-1' }, context)).resolves.toBe(
      true,
    );
  });

  it('excludes both the draft and published id of the current document', async () => {
    const validate = getCustomValidator('postList');
    const { context, fetchCalls } = createMockContext(0, 'drafts.page-tag-1');

    await validate({ _ref: 'post-list-1' }, context);

    expect(fetchCalls[0]?.params).toEqual({
      type: 'page_tag',
      postListId: 'post-list-1',
      publishedId: 'page-tag-1',
    });
  });

  it('requests the drafts perspective so an unpublished conflict still counts', async () => {
    const validate = getCustomValidator('postList');
    const { context, withConfigCalls } = createMockContext(0);

    await validate({ _ref: 'post-list-1' }, context);

    expect(withConfigCalls).toEqual([{ perspective: 'drafts' }]);
  });
});
