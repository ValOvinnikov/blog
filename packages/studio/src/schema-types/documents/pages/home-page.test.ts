import { homePageSchema } from '@blog/studio/schema-types/documents/pages/home-page';
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

type TArrayFieldDefinition = {
  type: 'array';
  of?: Array<{ name?: string }>;
};

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
  it('orders fields title, sectionHeader, hero, modules, seo', () => {
    expect(homePageSchema.fields?.map((field) => field.name)).toEqual([
      'title',
      'sectionHeader',
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
  const buildDocumentRules = (): TDocumentMockRule[] => {
    if (!homePageSchema.validation) {
      throw new Error('Expected homePageSchema to define a validation rule.');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    return (homePageSchema.validation as any)(
      createDocumentMockRule(),
    ) as TDocumentMockRule[];
  };

  it('errors when neither hero nor sectionHeader.heading is set', () => {
    const [requiredRule] = buildDocumentRules();

    expect(requiredRule?.fn?.({})).toBe('Add a hero or a heading');
  });

  it('warns when both hero and sectionHeader.heading are set', () => {
    const [, notBothRule] = buildDocumentRules();

    expect(
      notBothRule?.fn?.({
        hero: { _ref: 'hero-1' },
        sectionHeader: { heading: 'Welcome' },
      }),
    ).toBe('The hero hides the heading');
  });

  it('passes when exactly one of hero or sectionHeader.heading is set', () => {
    const [requiredRule, notBothRule] = buildDocumentRules();
    const document = { hero: { _ref: 'hero-1' } };

    expect(requiredRule?.fn?.(document)).toBe(true);
    expect(notBothRule?.fn?.(document)).toBe(true);
  });
});
