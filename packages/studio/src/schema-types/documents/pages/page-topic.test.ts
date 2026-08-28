import { topicSchema } from '@blog/studio/schema-types/documents/blog/topic';
import { pageTopicSchema } from '@blog/studio/schema-types/documents/pages/page-topic';
import { postListSchema } from '@blog/studio/schema-types/modules/module-post-list';
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
  pageTopicSchema.fields?.find((field) => field.name === name);

describe('pageTopicSchema shape', () => {
  it('title is required via the shared titleField() helper', () => {
    const titleFieldDefinition = getField('title');

    if (!titleFieldDefinition?.validation) {
      throw new Error('Expected pageTopicSchema to define a title field.');
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

  it('postList references module_postList and stays optional', () => {
    const postListField = getField('postList') as
      TReferenceFieldDefinition | undefined;

    if (!postListField || postListField.type !== 'reference') {
      throw new Error(
        'Expected pageTopicSchema to define a postList reference field.',
      );
    }

    expect(postListField.to?.map((target) => target.type)).toEqual([
      postListSchema.name,
    ]);
    expect(postListField.validation).toBeUndefined();
  });

  it('modules allows module_postLatest, module_cta, and module_newsletter', () => {
    const modulesField = getField('modules') as
      TArrayFieldDefinition | undefined;

    if (!modulesField || modulesField.type !== 'array' || !modulesField.of) {
      throw new Error('Expected pageTopicSchema to define a modules field.');
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

describe('pageTopicSchema slug field', () => {
  const getSlugField = () =>
    getField('slug') as TSlugFieldDefinition | undefined;

  it('is sourced from title with a 96-char max', () => {
    const slugField = getSlugField();

    if (!slugField || slugField.type !== 'slug') {
      throw new Error('Expected pageTopicSchema to define a slug field.');
    }

    expect(slugField.options?.source).toBe('title');
    expect(slugField.options?.maxLength).toBe(96);
  });

  it('is required', () => {
    const slugField = getSlugField();

    if (!slugField?.validation) {
      throw new Error(
        'Expected pageTopicSchema slug field to define validation.',
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
    // /topics/{slug} collisions only matter within page_topic itself, which
    // is exactly Sanity's default slug uniqueness scope — no custom
    // `isUnique` is needed on top of it.
    const slugField = getSlugField();

    expect(slugField?.options?.isUnique).toBeUndefined();
  });

  it('renders the shared URL-preview input', () => {
    const slugField = getSlugField();

    expect(typeof slugField?.components?.input).toBe('function');
  });
});

describe('pageTopicSchema topic field', () => {
  const getTopicField = () =>
    getField('topic') as TReferenceFieldDefinition | undefined;

  it('references blog_topic', () => {
    const topicField = getTopicField();

    if (!topicField || topicField.type !== 'reference') {
      throw new Error(
        'Expected pageTopicSchema to define a topic reference field.',
      );
    }

    expect(topicField.to?.map((target) => target.type)).toEqual([
      topicSchema.name,
    ]);
  });

  it('is required', () => {
    const topicField = getTopicField();

    if (!topicField?.validation) {
      throw new Error(
        'Expected pageTopicSchema topic field to define validation.',
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
    (topicField.validation as any)(rule);

    expect(requiredCalled).toBe(true);
  });
});

type TReferenceValue = { _ref?: string } | undefined;
type TCustomFn = (
  value: TReferenceValue,
  context: ValidationContext,
) => Promise<string | true>;

const UNIQUENESS_ERROR =
  'Another Topic Page already references this topic — each topic can only back one Topic Page.';

/**
 * `validateUniqueTopicReference` is private to page-topic.ts; the `topic`
 * field's `validation` builder registers it via `rule.custom(fn)`, so a
 * minimal chainable mock rule captures it the same way home-page.test.ts
 * captures its modules-field custom validator — no export needed.
 */
const getUniqueTopicValidator = (): TCustomFn => {
  const topicField = pageTopicSchema.fields?.find(
    (field) => field.name === 'topic',
  );

  if (!topicField?.validation) {
    throw new Error(
      'Expected pageTopicSchema to define a topic field with validation.',
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
  (topicField.validation as any)(rule);

  if (!customFn) {
    throw new Error('Expected topic field validation to register custom().');
  }

  return customFn;
};

const createMockContext = (
  conflictingCount: number,
  documentId = 'page-topic-1',
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

describe('validateUniqueTopicReference', () => {
  it('passes without querying when no reference is set', async () => {
    const validate = getUniqueTopicValidator();
    const { context, fetchCalls } = createMockContext(0);

    await expect(validate(undefined, context)).resolves.toBe(true);
    expect(fetchCalls).toHaveLength(0);
  });

  it('passes when no other page_topic references the same topic', async () => {
    const validate = getUniqueTopicValidator();
    const { context } = createMockContext(0);

    await expect(validate({ _ref: 'topic-1' }, context)).resolves.toBe(true);
  });

  it('flags a conflicting page_topic referencing the same topic', async () => {
    const validate = getUniqueTopicValidator();
    const { context } = createMockContext(1);

    await expect(validate({ _ref: 'topic-1' }, context)).resolves.toBe(
      UNIQUENESS_ERROR,
    );
  });

  it('excludes both the draft and published id of the current document', async () => {
    const validate = getUniqueTopicValidator();
    const { context, fetchCalls } = createMockContext(0, 'drafts.page-topic-1');

    await validate({ _ref: 'topic-1' }, context);

    expect(fetchCalls[0]?.params).toEqual({
      type: 'page_topic',
      topicId: 'topic-1',
      publishedId: 'page-topic-1',
    });
  });

  it('requests the drafts perspective so an unpublished conflict still counts', async () => {
    const validate = getUniqueTopicValidator();
    const { context, withConfigCalls } = createMockContext(0);

    await validate({ _ref: 'topic-1' }, context);

    expect(withConfigCalls).toEqual([{ perspective: 'drafts' }]);
  });
});
