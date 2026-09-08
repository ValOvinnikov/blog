import { homePageSchema } from '@blog/studio/schema-types/documents/pages/home-page';
import { validateTaxonomyListHasTaxonomy } from '@blog/studio/schema-types/helpers/validate-taxonomy-list-has-taxonomy';
import { HERO_SCHEMA_TYPES } from '@blog/studio/schema-types/modules';
import { postLatestSchema } from '@blog/studio/schema-types/modules/module-post-latest';
import type { ValidationContext } from 'sanity';

type TArrayFieldDefinition = {
  type: 'array';
  of?: Array<{ name?: string }>;
};

type TModuleReference = { _type?: string; _ref?: string };
type TCustomFn = (
  modules: TModuleReference[] | undefined,
  context: ValidationContext,
) => Promise<string | true>;

type TMockRule = {
  unique: () => TMockRule;
  error: (message: string) => TMockRule;
  custom: (fn: TCustomFn) => TMockRule;
};

/**
 * `unique()`/`error()`/`custom()` each return a fresh mock rule wrapping the
 * same shared `customFns` array, mirroring the real Sanity `Rule` chain
 * (`rule.custom(a).custom(b)`) closely enough to observe whether both
 * `.custom()` calls actually register, rather than the second silently
 * displacing the first.
 */
const createMockRule = (customFns: TCustomFn[]): TMockRule => ({
  unique: () => createMockRule(customFns),
  error: () => createMockRule(customFns),
  custom: (fn) => {
    customFns.push(fn);
    return createMockRule(customFns);
  },
});

const getModulesCustomValidators = (): TCustomFn[] => {
  const modulesField = homePageSchema.fields?.find(
    (field) => field.name === 'modules',
  );

  if (!modulesField?.validation) {
    throw new Error(
      'Expected homePageSchema to define a modules field with validation.',
    );
  }

  const customFns: TCustomFn[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
  (modulesField.validation as any)(createMockRule(customFns));

  return customFns;
};

describe('homePageSchema modules validateCustom chaining', () => {
  it('registers both the blank-heading and taxonomy-list validators', () => {
    const customFns = getModulesCustomValidators();

    expect(customFns).toHaveLength(2);
    expect(customFns[1]).toBe(validateTaxonomyListHasTaxonomy);
  });

  it('keeps the blank-heading validator scoped to module_postLatest, not displaced by the taxonomy-list validator', async () => {
    const [blankHeadingFn] = getModulesCustomValidators();
    const context = {
      getClient: () => ({
        withConfig: () => ({
          fetch: async () => [
            { id: 'post-latest-1', heading: null },
            { id: 'post-latest-2', heading: null },
          ],
        }),
      }),
    } as unknown as ValidationContext;

    const modules: TModuleReference[] = [
      { _type: postLatestSchema.name, _ref: 'post-latest-1' },
      { _type: postLatestSchema.name, _ref: 'post-latest-2' },
    ];

    await expect(blankHeadingFn?.(modules, context)).resolves.toContain(
      'Only one module of this type without its own heading is allowed per page',
    );
  });
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

describe('homePageSchema hero field', () => {
  it('is a required reference to the hero family', () => {
    const heroField = homePageSchema.fields?.find(
      (field) => field.name === 'hero',
    ) as { type: string; to?: Array<{ type: string }> } | undefined;

    if (!heroField) {
      throw new Error('Expected homePageSchema to define a hero field.');
    }

    expect(heroField.type).toBe('reference');
    expect(heroField.to?.map((entry) => entry.type)).toEqual(
      HERO_SCHEMA_TYPES.map((schema) => schema.name),
    );
  });
});
