import { homePageSchema } from '@blog/studio/schema-types/documents/pages/home/home';
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

type TArrayFieldDefinition = {
  type: 'array';
  of?: Array<{ name?: string }>;
};

const getModulesCustomValidators = (): TModulesCustomFn[] => {
  const modulesField = homePageSchema.fields?.find(
    (field) => field.name === 'modules',
  );

  if (!modulesField?.validation) {
    throw new Error(
      'Expected homePageSchema to define a modules field with validation.',
    );
  }

  const customFns: TModulesCustomFn[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
  (modulesField.validation as any)(createMockModulesRule(customFns));

  return customFns;
};

describe('homePageSchema modules validateCustom chaining', () => {
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

describe('homePageSchema modules allow-list', () => {
  it('permits every modules[] module type', () => {
    const modulesField = homePageSchema.fields?.find(
      (field) => field.name === 'modules',
    ) as TArrayFieldDefinition | undefined;

    if (!modulesField || modulesField.type !== 'array' || !modulesField.of) {
      throw new Error(
        'Expected homePageSchema to define a modules array field.',
      );
    }

    const allowedTypes = modulesField.of.map((member) => member.name);

    expect(allowedTypes).toEqual([
      'module_content',
      'module_cta',
      'module_newsletter',
      'module_postLatest',
      'module_taxonomyList',
      'module_postFeatured',
    ]);
    expect(allowedTypes).not.toContain('module_postList');
  });
});

describe('homePageSchema field order', () => {
  it('orders fields title, headingBlock, hero, modules, seo', () => {
    expect(homePageSchema.fields?.map((field) => field.name)).toEqual([
      'title',
      'headingBlock',
      'hero',
      'modules',
      'seo',
    ]);
  });
});

describe('homePageSchema hero field', () => {
  it('is an optional reference to the hero family', () => {
    const heroField = homePageSchema.fields?.find(
      (field) => field.name === 'hero',
    ) as
      | { type: string; to?: Array<{ type: string }>; validation?: unknown }
      | undefined;

    if (!heroField) {
      throw new Error('Expected homePageSchema to define a hero field.');
    }

    expect(heroField.type).toBe('reference');
    expect(heroField.to?.map((entry) => entry.type)).toEqual(
      HERO_SCHEMA_TYPES.map((schema) => schema.name),
    );
    expect(heroField.validation).toBeUndefined();
  });
});

describe('homePageSchema document validation', () => {
  it('defines no document-level validation — heading requiredness lives on the field', () => {
    expect(homePageSchema.validation).toBeUndefined();
  });
});

describe('homePageSchema headingBlock field', () => {
  it('is required and states that a hero hides it', () => {
    const headingBlockFieldDefinition = homePageSchema.fields?.find(
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
