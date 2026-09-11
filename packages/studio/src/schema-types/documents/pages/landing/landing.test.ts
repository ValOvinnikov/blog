import { landingSchema } from '@blog/studio/schema-types/documents/pages/landing';
import { validateTaxonomyListHasTaxonomy } from '@blog/studio/schema-types/helpers/validate-taxonomy-list-has-taxonomy';
import { HERO_SCHEMA_TYPES } from '@blog/studio/schema-types/modules';
import { postFeaturedSchema } from '@blog/studio/schema-types/modules/module-post-featured';
import { postLatestSchema } from '@blog/studio/schema-types/modules/module-post-latest';
import {
  createMockModulesRule,
  type TModuleReference,
  type TModulesCustomFn,
} from '@blog/studio/testing/create-mock-modules-rule';
import type { ValidationContext } from 'sanity';

type TDocumentCustomFn = (document: Record<string, unknown>) => string | true;

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

const getModulesCustomValidators = (): TModulesCustomFn[] => {
  const modulesField = landingSchema.fields?.find(
    (field) => field.name === 'modules',
  );

  if (!modulesField?.validation) {
    throw new Error(
      'Expected landingSchema to define a modules field with validation.',
    );
  }

  const customFns: TModulesCustomFn[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
  (modulesField.validation as any)(createMockModulesRule(customFns));

  return customFns;
};

describe('landingSchema modules validateCustom chaining', () => {
  it('registers both the blank-heading and taxonomy-list validators', () => {
    const customFns = getModulesCustomValidators();

    expect(customFns).toHaveLength(2);
    expect(customFns[1]).toBe(validateTaxonomyListHasTaxonomy);
  });

  it.each([
    ['module_postLatest', postLatestSchema.name],
    ['module_postFeatured', postFeaturedSchema.name],
  ])(
    'keeps the blank-heading validator scoped to %s, not displaced by the taxonomy-list validator',
    async (_label, moduleType) => {
      const [blankHeadingFn] = getModulesCustomValidators();
      const context = {
        getClient: () => ({
          withConfig: () => ({
            fetch: async () => [
              { id: 'module-1', heading: null },
              { id: 'module-2', heading: null },
            ],
          }),
        }),
      } as unknown as ValidationContext;

      const modules: TModuleReference[] = [
        { _type: moduleType, _ref: 'module-1' },
        { _type: moduleType, _ref: 'module-2' },
      ];

      await expect(blankHeadingFn?.(modules, context)).resolves.toContain(
        'Only one module of this type without its own heading is allowed per page',
      );
    },
  );
});

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
  const slugField = landingSchema.fields?.find(
    (field) => field.name === 'slug',
  );

  if (!slugField?.validation) {
    throw new Error(
      'Expected landingSchema to define a slug field with validation.',
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

describe('landingSchema slug validation', () => {
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
    const slugField = landingSchema.fields?.find(
      (field) => field.name === 'slug',
    ) as { components?: { input?: unknown } } | undefined;

    expect(typeof slugField?.components?.input).toBe('function');
  });
});

describe('landingSchema hero field', () => {
  it('is an optional reference to the hero family', () => {
    const heroField = landingSchema.fields?.find(
      (field) => field.name === 'hero',
    ) as { type: string; to?: Array<{ type: string }>; validation?: unknown };

    expect(heroField).toBeDefined();
    expect(heroField.type).toBe('reference');
    expect(heroField.to?.map((entry) => entry.type)).toEqual(
      HERO_SCHEMA_TYPES.map((schema) => schema.name),
    );
    expect(heroField.validation).toBeUndefined();
  });
});

describe('landingSchema modules allow-list', () => {
  it('permits content, cta, postLatest, postFeatured, newsletter and taxonomyList modules', () => {
    const modulesField = landingSchema.fields?.find(
      (field) => field.name === 'modules',
    ) as { type: 'array'; of?: Array<{ name?: string }> } | undefined;

    if (!modulesField || modulesField.type !== 'array' || !modulesField.of) {
      throw new Error(
        'Expected landingSchema to define a modules array field.',
      );
    }

    const allowedTypes = modulesField.of.map((member) => member.name);

    expect(allowedTypes).toEqual([
      'module_content',
      'module_cta',
      'module_postLatest',
      'module_postFeatured',
      'module_newsletter',
      'module_taxonomyList',
    ]);
  });
});

describe('landingSchema field order', () => {
  it('orders fields title, slug, headingBlock, hero, modules, seo', () => {
    expect(landingSchema.fields?.map((field) => field.name)).toEqual([
      'title',
      'slug',
      'headingBlock',
      'hero',
      'modules',
      'seo',
    ]);
  });
});

describe('landingSchema document validation', () => {
  const buildDocumentRules = (): TDocumentMockRule[] => {
    if (!landingSchema.validation) {
      throw new Error('Expected landingSchema to define a validation rule.');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    return (landingSchema.validation as any)(
      createDocumentMockRule(),
    ) as TDocumentMockRule[];
  };

  it('errors when neither hero nor headingBlock.heading is set', () => {
    const [requiredRule] = buildDocumentRules();

    expect(requiredRule?.fn?.({})).toBe('Add a hero or a heading');
  });

  it('warns when both hero and headingBlock.heading are set', () => {
    const [, notBothRule] = buildDocumentRules();

    expect(
      notBothRule?.fn?.({
        hero: { _ref: 'hero-1' },
        headingBlock: { heading: 'Welcome' },
      }),
    ).toBe('The hero hides the heading');
  });

  it('passes when only hero is set', () => {
    const [requiredRule, notBothRule] = buildDocumentRules();
    const document = { hero: { _ref: 'hero-1' } };

    expect(requiredRule?.fn?.(document)).toBe(true);
    expect(notBothRule?.fn?.(document)).toBe(true);
  });

  it('passes when only headingBlock.heading is set', () => {
    const [requiredRule, notBothRule] = buildDocumentRules();
    const document = { headingBlock: { heading: 'Welcome' } };

    expect(requiredRule?.fn?.(document)).toBe(true);
    expect(notBothRule?.fn?.(document)).toBe(true);
  });
});
