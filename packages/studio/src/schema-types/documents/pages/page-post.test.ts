import { pagePostSchema } from '@blog/studio/schema-types/documents/pages/page-post';
import { ctaSchema } from '@blog/studio/schema-types/modules/module-cta';
import { newsletterSchema } from '@blog/studio/schema-types/modules/module-newsletter';
import { postRelatedSchema } from '@blog/studio/schema-types/modules/module-post-related';

type TReferenceFieldDefinition = {
  type: 'reference';
  to?: Array<{ type?: string }>;
  validation?: unknown;
};

type TValidationRule = {
  required: () => TValidationRule;
  min: (value: number) => TValidationRule;
  max: (value: number) => TValidationRule;
  custom: (fn: unknown) => TValidationRule;
};

const getField = (name: string) =>
  pagePostSchema.fields?.find((field) => field.name === name);

const createTrackingRule = () => {
  const calls = {
    required: false,
    min: undefined as number | undefined,
    max: undefined as number | undefined,
  };

  const rule: TValidationRule = {
    required: () => {
      calls.required = true;
      return rule;
    },
    min: (value) => {
      calls.min = value;
      return rule;
    },
    max: (value) => {
      calls.max = value;
      return rule;
    },
    custom: () => rule,
  };

  return { rule, calls };
};

describe('pagePostSchema shape', () => {
  it('title is required via the shared titleField() helper — an internal label, not the rendered headline', () => {
    const titleFieldDefinition = getField('title');

    if (!titleFieldDefinition?.validation) {
      throw new Error('Expected pagePostSchema to define a title field.');
    }

    const { rule, calls } = createTrackingRule();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    (titleFieldDefinition.validation as any)(rule);

    expect(calls.required).toBe(true);
    expect(calls.max).toBeUndefined();
  });

  it('publishedAt is a required datetime field', () => {
    const publishedAtField = getField('publishedAt') as
      { type: string; validation?: unknown } | undefined;

    if (!publishedAtField || publishedAtField.type !== 'datetime') {
      throw new Error(
        'Expected pagePostSchema to define a publishedAt datetime field.',
      );
    }

    const { rule, calls } = createTrackingRule();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    (publishedAtField.validation as any)(rule);

    expect(calls.required).toBe(true);
  });

  it('has no top-level excerpt field — the excerpt lives in headingBlock.supportingText', () => {
    expect(getField('excerpt')).toBeUndefined();
  });

  it('headingBlock uses the required-heading variant — the heading is the post headline', () => {
    const headingBlockFieldDefinition = getField('headingBlock') as
      { type?: string } | undefined;

    expect(headingBlockFieldDefinition?.type).toBe('requiredHeadingBlock');
  });

  it('heroImage stays optional — no validation() builder attached', () => {
    expect(getField('heroImage')?.validation).toBeUndefined();
  });

  it('author is a required reference', () => {
    const authorField = getField('author') as
      TReferenceFieldDefinition | undefined;

    if (!authorField?.validation) {
      throw new Error('Expected pagePostSchema to define an author field.');
    }

    const { rule, calls } = createTrackingRule();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    (authorField.validation as any)(rule);

    expect(calls.required).toBe(true);
  });

  it('topic is a required reference', () => {
    const topicField = getField('topic') as
      TReferenceFieldDefinition | undefined;

    if (!topicField?.validation) {
      throw new Error('Expected pagePostSchema to define a topic field.');
    }

    const { rule, calls } = createTrackingRule();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    (topicField.validation as any)(rule);

    expect(calls.required).toBe(true);
  });

  it('tags caps at 6 and is optional', () => {
    const tagsField = getField('tags');

    if (!tagsField?.validation) {
      throw new Error('Expected pagePostSchema to define a tags field.');
    }

    const { rule, calls } = createTrackingRule();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    (tagsField.validation as any)(rule);

    expect(calls.required).toBe(false);
    expect(calls.max).toBe(6);
  });

  it('content is a required richText field', () => {
    const contentField = getField('content');

    if (!contentField?.validation) {
      throw new Error('Expected pagePostSchema to define a content field.');
    }

    const { rule, calls } = createTrackingRule();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    (contentField.validation as any)(rule);

    expect(calls.required).toBe(true);
  });

  it('has no top-level post reference — the page absorbed the post directly', () => {
    expect(getField('post')).toBeUndefined();
  });

  it('featured and skim stay optional — no validation() builder attached', () => {
    expect(getField('featured')?.validation).toBeUndefined();
    expect(getField('skim')?.validation).toBeUndefined();
  });

  it('has no newsletterEnabled field — the newsletter module in modules[] is the toggle', () => {
    expect(getField('newsletterEnabled')).toBeUndefined();
  });

  it('has no postList slot', () => {
    expect(getField('postList')).toBeUndefined();
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

    const { rule, calls } = createTrackingRule();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    (slugField.validation as any)(rule);

    expect(calls.required).toBe(true);
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

describe('pagePostSchema modules field', () => {
  const getModulesField = () =>
    getField('modules') as
      | { type: 'array'; of?: Array<{ to?: Array<{ type: string }> }> }
      | undefined;

  it('allows postRelated, newsletter and cta modules, and no content module', () => {
    const modulesField = getModulesField();

    if (!modulesField || modulesField.type !== 'array') {
      throw new Error('Expected pagePostSchema to define a modules field.');
    }

    const allowedTypes = modulesField.of?.map((member) => member.to?.[0]?.type);

    expect(allowedTypes).toEqual([
      postRelatedSchema.name,
      newsletterSchema.name,
      ctaSchema.name,
    ]);
  });
});

describe('pagePostSchema field order', () => {
  it('lists fields in authoring order', () => {
    const fieldNames = pagePostSchema.fields?.map((field) => field.name);

    expect(fieldNames).toEqual([
      'title',
      'slug',
      'headingBlock',
      'heroImage',
      'content',
      'featured',
      'author',
      'topic',
      'tags',
      'modules',
      'publishedAt',
      'skim',
      'seo',
    ]);
  });
});

describe('pagePostSchema preview', () => {
  it('shows the section header heading and author', () => {
    const prepare = pagePostSchema.preview?.prepare;

    if (!prepare) {
      throw new Error('Expected pagePostSchema to define preview.prepare.');
    }

    expect(
      prepare({
        heading: 'Understanding GROQ',
        title: 'Wrapper Label',
        author: 'Jane Doe',
        media: undefined,
      }),
    ).toEqual({
      title: 'Understanding GROQ',
      subtitle: 'by Jane Doe',
      media: undefined,
    });
  });

  it('falls back to the internal title when headingBlock is absent', () => {
    const prepare = pagePostSchema.preview?.prepare;

    if (!prepare) {
      throw new Error('Expected pagePostSchema to define preview.prepare.');
    }

    expect(
      prepare({
        heading: undefined,
        title: 'Wrapper Label',
        author: 'Jane Doe',
        media: undefined,
      }),
    ).toEqual({
      title: 'Wrapper Label',
      subtitle: 'by Jane Doe',
      media: undefined,
    });
  });

  it('falls back to "Unknown" title and an empty subtitle', () => {
    const prepare = pagePostSchema.preview?.prepare;

    if (!prepare) {
      throw new Error('Expected pagePostSchema to define preview.prepare.');
    }

    expect(
      prepare({
        heading: undefined,
        title: undefined,
        author: undefined,
        media: undefined,
      }),
    ).toEqual({
      title: 'Unknown',
      subtitle: '',
      media: undefined,
    });
  });
});
