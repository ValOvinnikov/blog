import { TAXONOMY_KIND } from '@blog/config/constants';
import { tagIndexPageSchema } from '@blog/studio/schema-types/documents/pages/tag-index';
import { validateTaxonomyListHasTaxonomy } from '@blog/studio/schema-types/helpers/validate-taxonomy-list-has-taxonomy';
import { HERO_SCHEMA_TYPES } from '@blog/studio/schema-types/modules';
import { ctaSchema } from '@blog/studio/schema-types/modules/module-cta';
import { newsletterSchema } from '@blog/studio/schema-types/modules/module-newsletter';
import { postLatestSchema } from '@blog/studio/schema-types/modules/module-post-latest';
import { taxonomyListSchema } from '@blog/studio/schema-types/modules/module-taxonomy-list';
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

type TFieldDefinition = {
  name?: string;
  type?: string;
  readOnly?: boolean;
  deprecated?: { reason?: string };
  validation?: unknown;
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

const getField = (name: string): TFieldDefinition | undefined =>
  tagIndexPageSchema.fields?.find((field) => field.name === name) as
    TFieldDefinition | undefined;

const getModulesCustomValidators = (): TModulesCustomFn[] => {
  const modulesField = tagIndexPageSchema.fields?.find(
    (field) => field.name === 'modules',
  );

  if (!modulesField?.validation) {
    throw new Error(
      'Expected tagIndexPageSchema to define a modules field with validation.',
    );
  }

  const customFns: TModulesCustomFn[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
  (modulesField.validation as any)(createMockModulesRule(customFns));

  return customFns;
};

const buildDocumentRules = (): TDocumentMockRule[] => {
  if (!tagIndexPageSchema.validation) {
    throw new Error('Expected tagIndexPageSchema to define a validation rule.');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
  return (tagIndexPageSchema.validation as any)(
    createDocumentMockRule(),
  ) as TDocumentMockRule[];
};

describe('tagIndexPageSchema field order', () => {
  it('orders fields title, headingBlock, hero, modules, seo, then the deprecated taxonomyList field', () => {
    expect(tagIndexPageSchema.fields?.map((field) => field.name)).toEqual([
      'title',
      'headingBlock',
      'hero',
      'modules',
      'seo',
      'taxonomyList',
    ]);
  });
});

describe('tagIndexPageSchema hero field', () => {
  it('is an optional reference to the hero family', () => {
    const heroField = getField('hero') as
      | { type: string; to?: Array<{ type: string }>; validation?: unknown }
      | undefined;

    if (!heroField) {
      throw new Error('Expected tagIndexPageSchema to define a hero field.');
    }

    expect(heroField.type).toBe('reference');
    expect(heroField.to?.map((entry) => entry.type)).toEqual(
      HERO_SCHEMA_TYPES.map((schema) => schema.name),
    );
    expect(heroField.validation).toBeUndefined();
  });
});

describe('tagIndexPageSchema modules allow-list', () => {
  it('permits taxonomyList, postLatest, cta and newsletter modules', () => {
    const modulesField = getField('modules') as
      TArrayFieldDefinition | undefined;

    if (!modulesField || modulesField.type !== 'array' || !modulesField.of) {
      throw new Error(
        'Expected tagIndexPageSchema to define a modules array field.',
      );
    }

    expect(modulesField.of.map((member) => member.name)).toEqual([
      taxonomyListSchema.name,
      postLatestSchema.name,
      ctaSchema.name,
      newsletterSchema.name,
    ]);
  });
});

describe('tagIndexPageSchema modules validateCustom chaining', () => {
  it('registers both the blank-heading and taxonomy-list validators', () => {
    const customFns = getModulesCustomValidators();

    expect(customFns).toHaveLength(2);
    expect(customFns[1]).toBe(validateTaxonomyListHasTaxonomy);
  });

  it('registers the blank-heading validator scoped to module_postLatest', async () => {
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
      { _type: postLatestSchema.name, _ref: 'module-1' },
      { _type: postLatestSchema.name, _ref: 'module-2' },
    ];

    await expect(blankHeadingFn?.(modules, context)).resolves.toContain(
      'Only one module of this type without its own heading is allowed per page',
    );
  });
});

describe('tagIndexPageSchema document validation', () => {
  it('registers hero-or-heading, taxonomy-list cardinality, and taxonomy-kind rules', () => {
    const rules = buildDocumentRules();

    expect(rules).toHaveLength(5);
    expect(rules.map((rule) => rule.level)).toEqual([
      'error',
      'warning',
      'error',
      'warning',
      'error',
    ]);
  });

  it('errors when neither hero nor headingBlock.heading is set', () => {
    const [requiredRule] = buildDocumentRules();

    expect(requiredRule?.fn?.({})).toBe('Add a hero or a heading');
  });

  it('warns when both hero and headingBlock.heading are set', () => {
    const [, heroNotBothRule] = buildDocumentRules();

    expect(
      heroNotBothRule?.fn?.({
        hero: { _ref: 'hero-1' },
        headingBlock: { heading: 'Welcome' },
      }),
    ).toBe('The hero hides the heading');
  });

  it('errors when more than one module_taxonomyList is referenced', () => {
    const [, , singleTaxonomyListRule] = buildDocumentRules();

    expect(
      singleTaxonomyListRule?.fn?.({
        modules: [
          { _type: taxonomyListSchema.name, _ref: 'list-1' },
          { _type: taxonomyListSchema.name, _ref: 'list-2' },
        ],
      }),
    ).toBe('Only one Taxonomy List module is allowed per page.');
  });

  it('passes cardinality when exactly one module_taxonomyList is referenced', () => {
    const [, , singleTaxonomyListRule, hasTaxonomyListRule] =
      buildDocumentRules();
    const document = {
      modules: [{ _type: taxonomyListSchema.name, _ref: 'list-1' }],
    };

    expect(singleTaxonomyListRule?.fn?.(document)).toBe(true);
    expect(hasTaxonomyListRule?.fn?.(document)).toBe(true);
  });

  it('warns when no module_taxonomyList is referenced', () => {
    const [, , , hasTaxonomyListRule] = buildDocumentRules();

    expect(hasTaxonomyListRule?.fn?.({ modules: [] })).toBe(
      'This page has no Taxonomy List module — the tag list will be empty until one is added.',
    );
  });
});

describe('tagIndexPageSchema taxonomy-kind rule', () => {
  const getTaxonomyKindRuleFn = () => {
    const rules = buildDocumentRules();
    return rules[4]?.fn;
  };

  it('passes when the modules[] taxonomy list matches the page kind', async () => {
    const fn = getTaxonomyKindRuleFn();
    const context = {
      getClient: () => ({
        withConfig: () => ({
          fetch: async () => [{ taxonomy: TAXONOMY_KIND.TAGS }],
        }),
      }),
    } as unknown as ValidationContext;

    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- validation fn is document-level async, the mock TDocumentMockRule type models the synchronous shared shape
      (fn as any)(
        {
          modules: [
            { _type: taxonomyListSchema.name, _ref: 'taxonomy-list-1' },
          ],
        },
        context,
      ),
    ).resolves.toBe(true);
  });

  it('fails when the modules[] taxonomy list is set to topics', async () => {
    const fn = getTaxonomyKindRuleFn();
    const context = {
      getClient: () => ({
        withConfig: () => ({
          fetch: async () => [{ taxonomy: TAXONOMY_KIND.TOPICS }],
        }),
      }),
    } as unknown as ValidationContext;

    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- validation fn is document-level async, the mock TDocumentMockRule type models the synchronous shared shape
      (fn as any)(
        {
          modules: [
            { _type: taxonomyListSchema.name, _ref: 'taxonomy-list-1' },
          ],
        },
        context,
      ),
    ).resolves.toBe('This page lists tags; the module is set to topics.');
  });

  it('fails when the deprecated taxonomyList field is set to topics', async () => {
    const fn = getTaxonomyKindRuleFn();
    const context = {
      getClient: () => ({
        withConfig: () => ({
          fetch: async () => [{ taxonomy: TAXONOMY_KIND.TOPICS }],
        }),
      }),
    } as unknown as ValidationContext;

    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- validation fn is document-level async, the mock TDocumentMockRule type models the synchronous shared shape
      (fn as any)({ taxonomyList: { _ref: 'taxonomy-list-legacy' } }, context),
    ).resolves.toBe('This page lists tags; the module is set to topics.');
  });
});

describe('tagIndexPageSchema deprecated taxonomyList field', () => {
  it('references module_taxonomyList, is readOnly, deprecated, and no longer required', () => {
    const taxonomyListField = getField('taxonomyList') as
      { to?: Array<{ type?: string }> } | undefined;

    expect((taxonomyListField as TFieldDefinition | undefined)?.readOnly).toBe(
      true,
    );
    expect(
      (taxonomyListField as TFieldDefinition | undefined)?.deprecated?.reason,
    ).toBeTruthy();
    expect(
      (taxonomyListField as TFieldDefinition | undefined)?.validation,
    ).toBeUndefined();
    expect(taxonomyListField?.to?.map((target) => target.type)).toEqual([
      taxonomyListSchema.name,
    ]);
  });
});
