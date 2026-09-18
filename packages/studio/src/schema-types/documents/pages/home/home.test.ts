import { homePageSchema } from '@blog/studio/schema-types/documents/pages/home/home';
import { postFeaturedSchema } from '@blog/studio/schema-types/modules/post-featured/post-featured';
import { postLatestSchema } from '@blog/studio/schema-types/modules/post-latest/post-latest';
import {
  createMockModulesRule,
  type TModuleReference,
  type TModulesCustomFn,
} from '@blog/studio/testing/create-mock-modules-rule';
import type { ValidationContext } from 'sanity';

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
