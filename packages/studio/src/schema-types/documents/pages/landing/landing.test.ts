import { landingPageSchema } from '@blog/studio/schema-types/documents/pages/landing/landing';
import { postFeaturedSchema } from '@blog/studio/schema-types/modules/post-featured/post-featured';
import { postLatestSchema } from '@blog/studio/schema-types/modules/post-latest/post-latest';
import {
  createMockModulesRule,
  type TModuleReference,
  type TModulesCustomFn,
} from '@blog/studio/testing/create-mock-modules-rule';
import { getCustomValidator } from '@blog/studio/testing/create-mock-validation-rule';
import { getField } from '@blog/studio/testing/get-field';
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

describe('landingPageSchema modules validateCustom chaining', () => {
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

type TSlugCustomFn = (value: { current?: string } | undefined) => string | true;

const getSlugCustomValidator = () =>
  getCustomValidator<TSlugCustomFn>(getField(landingPageSchema, 'slug'));

describe('landingPageSchema slug validation', () => {
  it.each(['blog', 'category', 'author', 'api', 'page'])(
    'rejects reserved slug "%s"',
    (reserved) => {
      const customFn = getSlugCustomValidator();

      expect(customFn({ current: reserved })).toBe(
        `"${reserved}" is a reserved path and can't be used as a page slug.`,
      );
    },
  );

  it('passes a non-reserved slug', () => {
    const customFn = getSlugCustomValidator();

    expect(customFn({ current: 'about-us' })).toBe(true);
  });

  it('passes when the slug value is not yet set', () => {
    const customFn = getSlugCustomValidator();

    expect(customFn(undefined)).toBe(true);
  });
});
