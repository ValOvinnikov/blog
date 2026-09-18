import { postPageSchema } from '@blog/studio/schema-types/documents/pages/post/post';
import { ctaSchema } from '@blog/studio/schema-types/modules/cta/cta';
import { newsletterSchema } from '@blog/studio/schema-types/modules/newsletter/newsletter';
import { postRelatedSchema } from '@blog/studio/schema-types/modules/post-related/post-related';
import { getField } from '@blog/studio/testing/get-field';

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

const getPostPageField = (name: string) => getField(postPageSchema, name);

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

describe('postPageSchema shape', () => {
  it('title is required via the shared titleField() helper — an internal label, not the rendered headline', () => {
    const titleFieldDefinition = getPostPageField('title');

    if (!titleFieldDefinition?.validation) {
      throw new Error('Expected postPageSchema to define a title field.');
    }

    const { rule, calls } = createTrackingRule();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    (titleFieldDefinition.validation as any)(rule);

    expect(calls.required).toBe(true);
    expect(calls.max).toBeUndefined();
  });

  it('publishedAt is a required datetime field', () => {
    const publishedAtField = getPostPageField('publishedAt') as
      { type: string; validation?: unknown } | undefined;

    if (!publishedAtField || publishedAtField.type !== 'datetime') {
      throw new Error(
        'Expected postPageSchema to define a publishedAt datetime field.',
      );
    }

    const { rule, calls } = createTrackingRule();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    (publishedAtField.validation as any)(rule);

    expect(calls.required).toBe(true);
  });

  it('has no top-level excerpt field — the excerpt lives in headingBlock.supportingText', () => {
    expect(
      postPageSchema.fields?.find((field) => field.name === 'excerpt'),
    ).toBeUndefined();
  });

  it('headingBlock uses the shared headingBlock object type, required at the field level — the heading is the post headline', () => {
    const headingBlockFieldDefinition = getPostPageField('headingBlock') as
      { type?: string; validation?: unknown } | undefined;

    expect(headingBlockFieldDefinition?.type).toBe('headingBlock');

    if (!headingBlockFieldDefinition?.validation) {
      throw new Error(
        'Expected postPageSchema to define a headingBlock field.',
      );
    }

    const { rule, calls } = createTrackingRule();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    (headingBlockFieldDefinition.validation as any)(rule);

    expect(calls.required).toBe(true);
  });

  it('headingBlock carries the shared headingBlockField description', () => {
    const headingBlockFieldDefinition = getPostPageField('headingBlock') as
      { type?: string; description?: string } | undefined;

    expect(headingBlockFieldDefinition?.description).toBe(
      'The heading shown at the top of this page or module, with its optional supporting line.',
    );
  });

  it('heroImage stays optional — no validation() builder attached', () => {
    expect(getPostPageField('heroImage')?.validation).toBeUndefined();
  });

  it('author is a required reference', () => {
    const authorField = getPostPageField('author') as
      TReferenceFieldDefinition | undefined;

    if (!authorField?.validation) {
      throw new Error('Expected postPageSchema to define an author field.');
    }

    const { rule, calls } = createTrackingRule();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    (authorField.validation as any)(rule);

    expect(calls.required).toBe(true);
  });

  it('topic is a required reference', () => {
    const topicField = getPostPageField('topic') as
      TReferenceFieldDefinition | undefined;

    if (!topicField?.validation) {
      throw new Error('Expected postPageSchema to define a topic field.');
    }

    const { rule, calls } = createTrackingRule();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    (topicField.validation as any)(rule);

    expect(calls.required).toBe(true);
  });

  it('tags caps at 6 and is optional', () => {
    const tagsField = getPostPageField('tags');

    if (!tagsField?.validation) {
      throw new Error('Expected postPageSchema to define a tags field.');
    }

    const { rule, calls } = createTrackingRule();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    (tagsField.validation as any)(rule);

    expect(calls.required).toBe(false);
    expect(calls.max).toBe(6);
  });

  it('content is a required richText field', () => {
    const contentField = getPostPageField('content');

    if (!contentField?.validation) {
      throw new Error('Expected postPageSchema to define a content field.');
    }

    const { rule, calls } = createTrackingRule();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    (contentField.validation as any)(rule);

    expect(calls.required).toBe(true);
  });

  it('has no top-level post reference — the page absorbed the post directly', () => {
    expect(
      postPageSchema.fields?.find((field) => field.name === 'post'),
    ).toBeUndefined();
  });

  it('featured and postTakeaways stay optional — no validation() builder attached', () => {
    expect(getPostPageField('featured')?.validation).toBeUndefined();
    expect(getPostPageField('postTakeaways')?.validation).toBeUndefined();
  });

  it('has no newsletterEnabled field — the newsletter module in modules[] is the toggle', () => {
    expect(
      postPageSchema.fields?.find(
        (field) => field.name === 'newsletterEnabled',
      ),
    ).toBeUndefined();
  });

  it('has no postList slot', () => {
    expect(
      postPageSchema.fields?.find((field) => field.name === 'postList'),
    ).toBeUndefined();
  });

  it('seo is required via the shared seoField() helper', () => {
    const seoFieldDefinition = getPostPageField('seo');

    if (!seoFieldDefinition?.validation) {
      throw new Error('Expected postPageSchema to define a seo field.');
    }

    const { rule, calls } = createTrackingRule();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    (seoFieldDefinition.validation as any)(rule);

    expect(calls.required).toBe(true);
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

describe('postPageSchema slug field', () => {
  const getSlugField = () =>
    getPostPageField('slug') as TSlugFieldDefinition | undefined;

  it('is sourced from title with a 96-char max', () => {
    const slugField = getSlugField();

    if (!slugField || slugField.type !== 'slug') {
      throw new Error('Expected postPageSchema to define a slug field.');
    }

    expect(slugField.options?.source).toBe('title');
    expect(slugField.options?.maxLength).toBe(96);
  });

  it('is required', () => {
    const slugField = getSlugField();

    if (!slugField?.validation) {
      throw new Error(
        'Expected postPageSchema slug field to define validation.',
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

describe('postPageSchema modules field', () => {
  const getModulesField = () =>
    getPostPageField('modules') as
      | { type: 'array'; of?: Array<{ to?: Array<{ type: string }> }> }
      | undefined;

  it('allows postRelated, newsletter and cta modules, and no content module', () => {
    const modulesField = getModulesField();

    if (!modulesField || modulesField.type !== 'array') {
      throw new Error('Expected postPageSchema to define a modules field.');
    }

    const allowedTypes = modulesField.of?.map((member) => member.to?.[0]?.type);

    expect(allowedTypes).toEqual([
      postRelatedSchema.name,
      newsletterSchema.name,
      ctaSchema.name,
    ]);
  });
});

describe('postPageSchema field order', () => {
  it('lists fields in authoring order', () => {
    const fieldNames = postPageSchema.fields?.map((field) => field.name);

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
      'postTakeaways',
      'seo',
    ]);
  });
});

describe('postPageSchema preview', () => {
  it('shows the section header heading and author', () => {
    const prepare = postPageSchema.preview?.prepare;

    if (!prepare) {
      throw new Error('Expected postPageSchema to define preview.prepare.');
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
    const prepare = postPageSchema.preview?.prepare;

    if (!prepare) {
      throw new Error('Expected postPageSchema to define preview.prepare.');
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
    const prepare = postPageSchema.preview?.prepare;

    if (!prepare) {
      throw new Error('Expected postPageSchema to define preview.prepare.');
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
