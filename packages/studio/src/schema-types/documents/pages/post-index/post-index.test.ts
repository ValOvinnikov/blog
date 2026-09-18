import { postIndexPageSchema } from '@blog/studio/schema-types/documents/pages/post-index/post-index';
import { postFeaturedSchema } from '@blog/studio/schema-types/modules/post-featured/post-featured';
import {
  createMockModulesRule,
  type TModuleReference,
  type TModulesCustomFn,
} from '@blog/studio/testing/create-mock-modules-rule';
import {
  getRecordedValidators,
  type TRecordedValidator,
} from '@blog/studio/testing/create-mock-validation-rule';
import type { ValidationContext } from 'sanity';

type TDocumentCustomFn = (document: Record<string, unknown>) => string | true;

describe('postIndexPageSchema modules validateCustom chaining', () => {
  const getModulesCustomValidators = (): TModulesCustomFn[] => {
    const modulesField = postIndexPageSchema.fields?.find(
      (field) => field.name === 'modules',
    );

    if (!modulesField?.validation) {
      throw new Error(
        'Expected postIndexPageSchema to define a modules field with validation.',
      );
    }

    const customFns: TModulesCustomFn[] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    (modulesField.validation as any)(createMockModulesRule(customFns));

    return customFns;
  };

  it('keeps the blank-heading validator scoped to module_postFeatured', async () => {
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
      { _type: postFeaturedSchema.name, _ref: 'module-1' },
      { _type: postFeaturedSchema.name, _ref: 'module-2' },
    ];

    await expect(blankHeadingFn?.(modules, context)).resolves.toContain(
      'Only one module of this type without its own heading is allowed per page',
    );
  });
});

describe('postIndexPageSchema document validation', () => {
  const buildDocumentRules = (): TRecordedValidator<TDocumentCustomFn>[] =>
    getRecordedValidators<TDocumentCustomFn>(postIndexPageSchema);

  describe('post list module count', () => {
    const postListModule = (ref: string) => ({
      _type: 'module_postList',
      _ref: ref,
    });

    it('errors when more than one module_postList is referenced', () => {
      const [countRule] = buildDocumentRules();

      expect(
        countRule?.fn?.({
          modules: [postListModule('list-1'), postListModule('list-2')],
        }),
      ).toBe('Only one Post List module is allowed per page.');
    });

    it('warns when no module_postList is referenced', () => {
      const [, presentRule] = buildDocumentRules();

      expect(presentRule?.fn?.({ modules: [] })).toBe(
        'Add a Post List module so this page can list posts.',
      );
      expect(presentRule?.fn?.({})).toBe(
        'Add a Post List module so this page can list posts.',
      );
    });

    it('passes when exactly one module_postList is referenced', () => {
      const [countRule, presentRule] = buildDocumentRules();
      const document = { modules: [postListModule('list-1')] };

      expect(countRule?.fn?.(document)).toBe(true);
      expect(presentRule?.fn?.(document)).toBe(true);
    });
  });
});
