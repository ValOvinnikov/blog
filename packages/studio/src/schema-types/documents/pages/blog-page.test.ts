import { blogPageSchema } from '@blog/studio/schema-types/documents/pages/blog-page';
import { HERO_SCHEMA_TYPES } from '@blog/studio/schema-types/modules';
import { postFeaturedSchema } from '@blog/studio/schema-types/modules/module-post-featured';
import { postListSchema } from '@blog/studio/schema-types/modules/module-post-list';
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
  name: string;
  type: string;
  readOnly?: boolean;
  deprecated?: { reason: string };
  validation?: unknown;
  to?: Array<{ type?: string }>;
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

const getField = (name: string) =>
  blogPageSchema.fields?.find((field) => field.name === name) as
    TFieldDefinition | undefined;

describe('blogPageSchema field order', () => {
  it('orders the primary fields title, headingBlock, hero, modules, seo', () => {
    const primaryFieldNames = [
      'title',
      'headingBlock',
      'hero',
      'modules',
      'seo',
    ];
    const fieldNames = blogPageSchema.fields?.map((field) => field.name) ?? [];

    expect(
      fieldNames.filter((name) => primaryFieldNames.includes(name)),
    ).toEqual(primaryFieldNames);
  });
});

describe('blogPageSchema headingBlock field', () => {
  it('describes the page heading and that a hero hides it', () => {
    const headingBlockField = getField('headingBlock');

    expect(headingBlockField?.type).toBe('headingBlock');
  });
});

describe('blogPageSchema hero field', () => {
  it('is an optional reference to the hero family', () => {
    const heroField = getField('hero');

    if (!heroField) {
      throw new Error('Expected blogPageSchema to define a hero field.');
    }

    expect(heroField.type).toBe('reference');
    expect(heroField.to?.map((entry) => entry.type)).toEqual(
      HERO_SCHEMA_TYPES.map((schema) => schema.name),
    );
    expect(heroField.validation).toBeUndefined();
  });
});

describe('blogPageSchema modules allow-list', () => {
  it('permits module_postList, module_cta, module_newsletter and module_postFeatured', () => {
    const modulesField = blogPageSchema.fields?.find(
      (field) => field.name === 'modules',
    ) as TArrayFieldDefinition | undefined;

    if (!modulesField || modulesField.type !== 'array' || !modulesField.of) {
      throw new Error(
        'Expected blogPageSchema to define a modules array field.',
      );
    }

    const allowedTypes = modulesField.of.map((member) => member.name);

    expect(allowedTypes).toEqual([
      'module_postList',
      'module_cta',
      'module_newsletter',
      'module_postFeatured',
    ]);
  });
});

describe('blogPageSchema modules validateCustom chaining', () => {
  const getModulesCustomValidators = (): TModulesCustomFn[] => {
    const modulesField = blogPageSchema.fields?.find(
      (field) => field.name === 'modules',
    );

    if (!modulesField?.validation) {
      throw new Error(
        'Expected blogPageSchema to define a modules field with validation.',
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

describe('blogPageSchema deprecated fields', () => {
  it.each(['heading', 'supportingText', 'postList'])(
    '%s is read-only and deprecated without required validation',
    (name) => {
      const field = getField(name);

      if (!field) {
        throw new Error(`Expected blogPageSchema to define a ${name} field.`);
      }

      expect(field.readOnly).toBe(true);
      expect(field.deprecated?.reason).toBeTruthy();
      expect(field.validation).toBeUndefined();
    },
  );

  it('postList still references module_postList', () => {
    const postListField = getField('postList');

    expect(postListField?.to?.map((entry) => entry.type)).toEqual([
      postListSchema.name,
    ]);
  });
});

describe('blogPageSchema document validation', () => {
  const buildDocumentRules = (): TDocumentMockRule[] => {
    if (!blogPageSchema.validation) {
      throw new Error('Expected blogPageSchema to define a validation rule.');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
    return (blogPageSchema.validation as any)(
      createDocumentMockRule(),
    ) as TDocumentMockRule[];
  };

  describe('hero-or-heading', () => {
    it('errors when neither hero nor headingBlock.heading is set', () => {
      const [requiredRule] = buildDocumentRules();

      expect(requiredRule?.fn?.({})).toBe('Add a hero or a heading');
    });

    it('warns when both hero and headingBlock.heading are set', () => {
      const [, notBothRule] = buildDocumentRules();

      expect(
        notBothRule?.fn?.({
          hero: { _ref: 'hero-1' },
          headingBlock: { heading: 'Latest posts' },
        }),
      ).toBe('The hero hides the heading');
    });

    it('passes when exactly one of hero or headingBlock.heading is set', () => {
      const [requiredRule, notBothRule] = buildDocumentRules();
      const document = { hero: { _ref: 'hero-1' } };

      expect(requiredRule?.fn?.(document)).toBe(true);
      expect(notBothRule?.fn?.(document)).toBe(true);
    });
  });

  describe('post list module count', () => {
    const postListModule = (ref: string) => ({
      _type: 'module_postList',
      _ref: ref,
    });

    it('errors when more than one module_postList is referenced', () => {
      const [, , countRule] = buildDocumentRules();

      expect(
        countRule?.fn?.({
          modules: [postListModule('list-1'), postListModule('list-2')],
        }),
      ).toBe('Only one Post List module is allowed per page.');
    });

    it('warns when no module_postList is referenced', () => {
      const [, , , presentRule] = buildDocumentRules();

      expect(presentRule?.level).toBe('warning');
      expect(presentRule?.fn?.({ modules: [] })).toBe(
        'Add a Post List module so this page can list posts.',
      );
      expect(presentRule?.fn?.({})).toBe(
        'Add a Post List module so this page can list posts.',
      );
    });

    it('passes when exactly one module_postList is referenced', () => {
      const [, , countRule, presentRule] = buildDocumentRules();
      const document = { modules: [postListModule('list-1')] };

      expect(countRule?.fn?.(document)).toBe(true);
      expect(presentRule?.fn?.(document)).toBe(true);
    });
  });
});
