import { genericSchema } from '@blog/studio/schema-types/documents/pages/page';

type TValidationRule = {
  required: () => TValidationRule;
  custom: (
    fn: (value: { current?: string } | undefined) => string | true,
  ) => TValidationRule;
};

/**
 * `field.validation` is a builder function `(rule) => rule.required().custom(fn)`
 * — invoking it with a minimal chainable mock rule captures the `fn` passed to
 * `.custom()` without spinning up a full Sanity Studio schema/rule instance.
 */
const getSlugCustomValidator = () => {
  const slugField = genericSchema.fields?.find(
    (field) => field.name === 'slug',
  );

  if (!slugField?.validation) {
    throw new Error(
      'Expected genericSchema to define a slug field with validation.',
    );
  }

  let requiredCalled = false;
  let customFn:
    ((value: { current?: string } | undefined) => string | true) | undefined;

  const rule: TValidationRule = {
    required: () => {
      requiredCalled = true;
      return rule;
    },
    custom: (fn) => {
      customFn = fn;
      return rule;
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
  (slugField.validation as any)(rule);

  if (!customFn) {
    throw new Error(
      'Expected slug field validation to register a custom() rule.',
    );
  }

  return { customFn, requiredCalled };
};

describe('genericSchema slug validation', () => {
  it('keeps the slug field required', () => {
    const { requiredCalled } = getSlugCustomValidator();

    expect(requiredCalled).toBe(true);
  });

  it('rejects a reserved slug with a clear message', () => {
    const { customFn } = getSlugCustomValidator();

    expect(customFn({ current: 'blog' })).toBe(
      `"blog" is a reserved path and can't be used as a page slug.`,
    );
  });

  it.each(['category', 'author', 'api', 'page'])(
    'rejects reserved slug "%s"',
    (reserved) => {
      const { customFn } = getSlugCustomValidator();

      expect(customFn({ current: reserved })).toBe(
        `"${reserved}" is a reserved path and can't be used as a page slug.`,
      );
    },
  );

  it('passes a non-reserved slug', () => {
    const { customFn } = getSlugCustomValidator();

    expect(customFn({ current: 'about-us' })).toBe(true);
  });

  it('passes when the slug value is not yet set', () => {
    const { customFn } = getSlugCustomValidator();

    expect(customFn(undefined)).toBe(true);
  });

  it('renders the shared URL-preview input', () => {
    const slugField = genericSchema.fields?.find(
      (field) => field.name === 'slug',
    ) as { components?: { input?: unknown } } | undefined;

    expect(typeof slugField?.components?.input).toBe('function');
  });
});

describe('genericSchema hero field', () => {
  it('is an optional reference to the hero family', () => {
    const heroField = genericSchema.fields?.find(
      (field) => field.name === 'hero',
    ) as { type: string; to?: Array<{ type: string }>; validation?: unknown };

    expect(heroField).toBeDefined();
    expect(heroField.type).toBe('reference');
    expect(heroField.to?.map((entry) => entry.type)).toEqual(['module_hero']);
    expect(heroField.validation).toBeUndefined();
  });
});

describe('genericSchema modules allow-list', () => {
  it('permits content, cta, postLatest and newsletter modules', () => {
    const modulesField = genericSchema.fields?.find(
      (field) => field.name === 'modules',
    ) as { type: 'array'; of?: Array<{ name?: string }> } | undefined;

    if (!modulesField || modulesField.type !== 'array' || !modulesField.of) {
      throw new Error(
        'Expected genericSchema to define a modules array field.',
      );
    }

    const allowedTypes = modulesField.of.map((member) => member.name);

    expect(allowedTypes).toEqual([
      'module_content',
      'module_cta',
      'module_postLatest',
      'module_newsletter',
    ]);
  });
});
