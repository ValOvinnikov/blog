import { landingPageSchema } from '@blog/studio/schema-types/documents/pages/landing/landing';
import { HERO_SCHEMA_TYPES } from '@blog/studio/schema-types/modules';
import { postFeaturedSchema } from '@blog/studio/schema-types/modules/post-featured/post-featured';
import { postLatestSchema } from '@blog/studio/schema-types/modules/post-latest/post-latest';
import { validateTaxonomyListHasTaxonomy } from '@blog/studio/schema-types/validation/validate-taxonomy-list-has-taxonomy/validate-taxonomy-list-has-taxonomy';
import {
  createMockModulesRule,
  type TModuleReference,
  type TModulesCustomFn,
} from '@blog/studio/testing/create-mock-modules-rule';
import type { ValidationContext } from 'sanity';

const getModulesCustomValidators = (): TModulesCustomFn[] => {
  const modulesField = landingPageSchema.fields?.find(
    (field) => field.name === 'modules',
  );

  if (!modulesField?.validation) {
    throw new Error(
      'Expected landingPageSchema to define a modules field with validation.',
    );
  }

  const customFns: TModulesCustomFn[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
  (modulesField.validation as any)(createMockModulesRule(customFns));

  return customFns;
};

describe('landingPageSchema shape', () => {
  it('title description tells the editor it also seeds the slug', () => {
    const titleFieldDefinition = landingPageSchema.fields?.find(
      (field) => field.name === 'title',
    );

    expect(titleFieldDefinition?.description).toBe(
      'Give this document a clear, descriptive title to help identify it in Studio. This title also is used to automatically generate the slug. This title for internal use only',
    );
  });
});

describe('landingPageSchema modules validateCustom chaining', () => {
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
  const slugField = landingPageSchema.fields?.find(
    (field) => field.name === 'slug',
  );

  if (!slugField?.validation) {
    throw new Error(
      'Expected landingPageSchema to define a slug field with validation.',
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

describe('landingPageSchema slug validation', () => {
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
    const slugField = landingPageSchema.fields?.find(
      (field) => field.name === 'slug',
    ) as { components?: { input?: unknown } } | undefined;

    expect(typeof slugField?.components?.input).toBe('function');
  });
});

describe('landingPageSchema hero field', () => {
  it('is an optional reference to the hero family', () => {
    const heroField = landingPageSchema.fields?.find(
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

describe('landingPageSchema modules allow-list', () => {
  it('permits content, cta, postLatest, postFeatured, newsletter and taxonomyList modules', () => {
    const modulesField = landingPageSchema.fields?.find(
      (field) => field.name === 'modules',
    ) as { type: 'array'; of?: Array<{ name?: string }> } | undefined;

    if (!modulesField || modulesField.type !== 'array' || !modulesField.of) {
      throw new Error(
        'Expected landingPageSchema to define a modules array field.',
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

describe('landingPageSchema field order', () => {
  it('orders fields title, slug, headingBlock, hero, modules, seo', () => {
    expect(landingPageSchema.fields?.map((field) => field.name)).toEqual([
      'title',
      'slug',
      'headingBlock',
      'hero',
      'modules',
      'seo',
    ]);
  });
});

describe('landingPageSchema document validation', () => {
  it('defines no document-level validation — heading requiredness lives on the field', () => {
    expect(landingPageSchema.validation).toBeUndefined();
  });
});

describe('landingPageSchema headingBlock field', () => {
  it('is required and states that a hero hides it', () => {
    const headingBlockFieldDefinition = landingPageSchema.fields?.find(
      (field) => field.name === 'headingBlock',
    ) as
      { type?: string; description?: string; validation?: unknown } | undefined;

    expect(headingBlockFieldDefinition?.type).toBe('headingBlock');
    expect(headingBlockFieldDefinition?.description).toBe(
      "The page heading, shown as the page's H1. Hidden when a hero is set — the hero's heading becomes the H1 instead. Still required, so the page keeps a heading if the hero is ever removed.",
    );
    expect(headingBlockFieldDefinition?.validation).toBeDefined();
  });
});
