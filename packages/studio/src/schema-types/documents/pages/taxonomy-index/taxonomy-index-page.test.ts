import { TAXONOMY_KIND } from '@blog/config/constants';
import { tagIndexPageSchema } from '@blog/studio/schema-types/documents/pages/tag-index/tag-index';
import { PAGE_TAG_INDEX_TYPE } from '@blog/studio/schema-types/documents/pages/tag-index/tag-index-type';
import { topicIndexPageSchema } from '@blog/studio/schema-types/documents/pages/topic-index/topic-index';
import { PAGE_TOPIC_INDEX_TYPE } from '@blog/studio/schema-types/documents/pages/topic-index/topic-index-type';
import { ctaSchema } from '@blog/studio/schema-types/modules/cta/cta';
import { heroBlogSchema } from '@blog/studio/schema-types/modules/hero-blog/hero-blog';
import { newsletterSchema } from '@blog/studio/schema-types/modules/newsletter/newsletter';
import { postLatestSchema } from '@blog/studio/schema-types/modules/post-latest/post-latest';
import { taxonomyListSchema } from '@blog/studio/schema-types/modules/taxonomy-list/taxonomy-list';
import { validateTaxonomyListHasTaxonomy } from '@blog/studio/schema-types/validation/validate-taxonomy-list-has-taxonomy/validate-taxonomy-list-has-taxonomy';
import {
  createMockModulesRule,
  type TModuleReference,
  type TModulesCustomFn,
} from '@blog/studio/testing/create-mock-modules-rule';
import { getField } from '@blog/studio/testing/get-field';
import type { SchemaTypeDefinition, ValidationContext } from 'sanity';

type TArrayFieldDefinition = {
  type: 'array';
  of?: Array<{ name?: string }>;
};

type TFieldDefinition = {
  name?: string;
  type?: string;
  description?: string;
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

type TIndexedSchema = { name?: string; fields?: TFieldDefinition[] };

const getModulesCustomValidators = (
  schema: SchemaTypeDefinition,
): TModulesCustomFn[] => {
  const modulesField = getField(schema as TIndexedSchema, 'modules');

  if (!modulesField?.validation) {
    throw new Error(
      `Expected ${schema.name} to define a modules field with validation.`,
    );
  }

  const customFns: TModulesCustomFn[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
  (modulesField.validation as any)(createMockModulesRule(customFns));

  return customFns;
};

const buildDocumentRules = (
  schema: SchemaTypeDefinition,
): TDocumentMockRule[] => {
  if (!schema.validation) {
    throw new Error(`Expected ${schema.name} to define a validation rule.`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
  return (schema.validation as any)(
    createDocumentMockRule(),
  ) as TDocumentMockRule[];
};

const fixtures = [
  {
    schemaName: 'tagIndexPageSchema',
    schema: tagIndexPageSchema,
    expectedName: PAGE_TAG_INDEX_TYPE,
    expectedDescription:
      'The page that lists every tag, for readers browsing by keyword.',
    kind: TAXONOMY_KIND.TAGS,
    otherKind: TAXONOMY_KIND.TOPICS,
    noTaxonomyListWarning:
      'This page has no Taxonomy List module — the tag list will be empty until one is added.',
    mismatchError: 'This page lists tags; the module is set to topics.',
    previewSubtitle: 'Tag index singleton',
  },
  {
    schemaName: 'topicIndexPageSchema',
    schema: topicIndexPageSchema,
    expectedName: PAGE_TOPIC_INDEX_TYPE,
    expectedDescription:
      'The page that lists every topic, for readers browsing by subject.',
    kind: TAXONOMY_KIND.TOPICS,
    otherKind: TAXONOMY_KIND.TAGS,
    noTaxonomyListWarning:
      'This page has no Taxonomy List module — the topic list will be empty until one is added.',
    mismatchError: 'This page lists topics; the module is set to tags.',
    previewSubtitle: 'Topic index singleton',
  },
];

describe.each(fixtures)(
  '$schemaName',
  ({
    schemaName,
    schema,
    expectedName,
    expectedDescription,
    kind,
    otherKind,
    noTaxonomyListWarning,
    mismatchError,
    previewSubtitle,
  }) => {
    it(`is named ${expectedName}`, () => {
      expect(schema.name).toBe(expectedName);
    });

    it('carries its own type-level description', () => {
      expect((schema as { description?: string }).description).toBe(
        expectedDescription,
      );
    });

    it(`preview reports "${previewSubtitle}"`, () => {
      if (!schema.preview?.prepare) {
        throw new Error(`Expected ${schemaName} to define a preview.prepare.`);
      }

      expect(schema.preview.prepare({ title: 'My Page' })).toEqual({
        title: 'My Page',
        subtitle: previewSubtitle,
      });
    });

    it('orders fields title, headingBlock, hero, modules, seo, then the deprecated taxonomyList field', () => {
      expect(
        (schema as { fields?: TFieldDefinition[] }).fields?.map(
          (field) => field.name,
        ),
      ).toEqual([
        'title',
        'headingBlock',
        'hero',
        'modules',
        'seo',
        'taxonomyList',
      ]);
    });

    it('hero field is an optional reference scoped to heroBlog only', () => {
      const heroField = getField(schema, 'hero') as
        | { type: string; to?: Array<{ type: string }>; validation?: unknown }
        | undefined;

      if (!heroField) {
        throw new Error(`Expected ${schemaName} to define a hero field.`);
      }

      expect(heroField.type).toBe('reference');
      expect(heroField.to?.map((entry) => entry.type)).toEqual([
        heroBlogSchema.name,
      ]);
      expect(heroField.validation).toBeUndefined();
    });

    it('headingBlock field is required', () => {
      const headingBlockField = getField(schema, 'headingBlock');

      expect(headingBlockField?.type).toBe('headingBlock');
      expect(headingBlockField?.validation).toBeDefined();
    });

    it('modules allow-list permits taxonomyList, postLatest, cta and newsletter modules', () => {
      const modulesField = getField(schema, 'modules') as
        TArrayFieldDefinition | undefined;

      if (!modulesField || modulesField.type !== 'array' || !modulesField.of) {
        throw new Error(
          `Expected ${schemaName} to define a modules array field.`,
        );
      }

      expect(modulesField.of.map((member) => member.name)).toEqual([
        taxonomyListSchema.name,
        postLatestSchema.name,
        ctaSchema.name,
        newsletterSchema.name,
      ]);
    });

    it('modules validateCustom registers both the blank-heading and taxonomy-list validators', () => {
      const customFns = getModulesCustomValidators(schema);

      expect(customFns).toHaveLength(2);
      expect(customFns[1]).toBe(validateTaxonomyListHasTaxonomy);
    });

    it('modules validateCustom registers the blank-heading validator scoped to module_postLatest', async () => {
      const [blankHeadingFn] = getModulesCustomValidators(schema);
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

    it('document validation registers taxonomy-list cardinality and taxonomy-kind rules', () => {
      const rules = buildDocumentRules(schema);

      expect(rules).toHaveLength(3);
      expect(rules.map((rule) => rule.level)).toEqual([
        'error',
        'warning',
        'error',
      ]);
    });

    it('errors when more than one module_taxonomyList is referenced', () => {
      const [singleTaxonomyListRule] = buildDocumentRules(schema);

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
      const [singleTaxonomyListRule, hasTaxonomyListRule] =
        buildDocumentRules(schema);
      const document = {
        modules: [{ _type: taxonomyListSchema.name, _ref: 'list-1' }],
      };

      expect(singleTaxonomyListRule?.fn?.(document)).toBe(true);
      expect(hasTaxonomyListRule?.fn?.(document)).toBe(true);
    });

    it('warns when no module_taxonomyList is referenced', () => {
      const [, hasTaxonomyListRule] = buildDocumentRules(schema);

      expect(hasTaxonomyListRule?.fn?.({ modules: [] })).toBe(
        noTaxonomyListWarning,
      );
    });

    it('taxonomy-kind rule passes when the modules[] taxonomy list matches the page kind', async () => {
      const [, , taxonomyKindRule] = buildDocumentRules(schema);
      const context = {
        getClient: () => ({
          withConfig: () => ({
            fetch: async () => [{ taxonomy: kind }],
          }),
        }),
      } as unknown as ValidationContext;

      await expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- validation fn is document-level async, the mock TDocumentMockRule type models the synchronous shared shape
        (taxonomyKindRule?.fn as any)(
          {
            modules: [
              { _type: taxonomyListSchema.name, _ref: 'taxonomy-list-1' },
            ],
          },
          context,
        ),
      ).resolves.toBe(true);
    });

    it('taxonomy-kind rule fails when the modules[] taxonomy list is set to the other kind', async () => {
      const [, , taxonomyKindRule] = buildDocumentRules(schema);
      const context = {
        getClient: () => ({
          withConfig: () => ({
            fetch: async () => [{ taxonomy: otherKind }],
          }),
        }),
      } as unknown as ValidationContext;

      await expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- validation fn is document-level async, the mock TDocumentMockRule type models the synchronous shared shape
        (taxonomyKindRule?.fn as any)(
          {
            modules: [
              { _type: taxonomyListSchema.name, _ref: 'taxonomy-list-1' },
            ],
          },
          context,
        ),
      ).resolves.toBe(mismatchError);
    });

    it('taxonomy-kind rule fails when the deprecated taxonomyList field is set to the other kind', async () => {
      const [, , taxonomyKindRule] = buildDocumentRules(schema);
      const context = {
        getClient: () => ({
          withConfig: () => ({
            fetch: async () => [{ taxonomy: otherKind }],
          }),
        }),
      } as unknown as ValidationContext;

      await expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- validation fn is document-level async, the mock TDocumentMockRule type models the synchronous shared shape
        (taxonomyKindRule?.fn as any)(
          { taxonomyList: { _ref: 'taxonomy-list-legacy' } },
          context,
        ),
      ).resolves.toBe(mismatchError);
    });

    it('deprecated taxonomyList field references module_taxonomyList, is readOnly, deprecated, and no longer required', () => {
      const taxonomyListField = getField(schema, 'taxonomyList') as
        { to?: Array<{ type?: string }> } | undefined;

      expect(
        (taxonomyListField as TFieldDefinition | undefined)?.readOnly,
      ).toBe(true);
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
  },
);
