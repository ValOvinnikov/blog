import { tagSchema } from '@blog/studio/schema-types/documents/blog/tag/tag';
import { tagPageSchema } from '@blog/studio/schema-types/documents/pages/tag/tag';
import { PAGE_TAG_TYPE } from '@blog/studio/schema-types/documents/pages/tag/tag-type';
import { HERO_SCHEMA_TYPES } from '@blog/studio/schema-types/modules';
import { postLatestSchema } from '@blog/studio/schema-types/modules/post-latest/post-latest';
import { postListSchema } from '@blog/studio/schema-types/modules/post-list/post-list';
import {
  getCustomValidator,
  getRecordedValidators,
  type TRecordedValidator,
} from '@blog/studio/testing/create-mock-validation-rule';
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
  it('is named page_tag', () => {
    expect(tagPageSchema.name).toBe(PAGE_TAG_TYPE);
  });

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
  it('is built via headingBlockField()', () => {
    const headingBlockField = getField('headingBlock') as
      THeadingBlockFieldDefinition | undefined;

    expect(headingBlockField?.type).toBe('headingBlock');
  });

  it('is required at the field level', () => {
    const headingBlockField = getField('headingBlock') as
      { validation?: unknown } | undefined;

    const customFn =
      getCustomValidator<THeadingBlockCustomFn>(headingBlockField);

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

  it('is required and registers the unique-taxonomy-reference validator', () => {
    const tagField = getTagField();

    if (!tagField?.validation) {
      throw new Error('Expected tagPageSchema tag field to define validation.');
    }

    let requiredCalled = false;
    let customCalled = false;
    const rule: TValidationRule = {
      required: () => {
        requiredCalled = true;
        return rule;
      },
      custom: () => {
        customCalled = true;
        return rule;
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    (tagField.validation as any)(rule);

    expect(requiredCalled).toBe(true);
    expect(customCalled).toBe(true);
  });
});

type TDocumentCustomFn = (
  document: Record<string, unknown>,
  context: ValidationContext,
) => string | true | Promise<string | true>;

const buildDocumentRules = (): TRecordedValidator<TDocumentCustomFn>[] =>
  getRecordedValidators<TDocumentCustomFn>(tagPageSchema);

describe('tagPageSchema document validation wiring', () => {
  it('registers single, has, and unique-post-list-reference rules at the right severities', () => {
    const rules = buildDocumentRules();

    expect(rules).toHaveLength(3);
    expect(rules.map((rule) => rule.level)).toEqual([
      'error',
      'warning',
      'error',
    ]);
  });

  it('the single-post-list rule errors when more than one module_postList is referenced', () => {
    const [singlePostListRule] = buildDocumentRules();

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

  it('the has-post-list rule warns with page-scoped copy when none is referenced', () => {
    const [, hasPostListRule] = buildDocumentRules();

    expect(
      hasPostListRule?.fn?.(
        { modules: [{ _type: postLatestSchema.name, _ref: 'latest-1' }] },
        {} as ValidationContext,
      ),
    ).toBe(
      'This page has no Post List module — the archive will be empty until one is added.',
    );
  });

  it('the unique-post-list-reference rule flags a conflicting page_tag with page-scoped copy', async () => {
    const [, , uniquePostListRule] = buildDocumentRules();
    const fetchCalls: { query: string; params: unknown }[] = [];

    const context = {
      getClient: () => ({
        withConfig: () => ({
          fetch: async (query: string, params: unknown) => {
            fetchCalls.push({ query, params });
            return 1;
          },
        }),
      }),
    } as unknown as ValidationContext;

    await expect(
      uniquePostListRule?.fn?.(
        {
          _id: 'page-tag-1',
          modules: [{ _type: postListSchema.name, _ref: 'post-list-1' }],
        },
        context,
      ),
    ).resolves.toBe(
      'Another Tag Page already references this Post List — each Post List can only back one Tag Page.',
    );
    expect(fetchCalls[0]?.params).toMatchObject({ type: PAGE_TAG_TYPE });
  });
});
