import { TAXONOMY_KIND } from '@blog/config/constants';
import { tagIndexPageSchema } from '@blog/studio/schema-types/documents/pages/tag-index/tag-index';
import { topicIndexPageSchema } from '@blog/studio/schema-types/documents/pages/topic-index/topic-index';
import { taxonomyListSchema } from '@blog/studio/schema-types/modules/taxonomy-list/taxonomy-list';
import type { SchemaTypeDefinition, ValidationContext } from 'sanity';

type TDocumentCustomFn = (
  document: Record<string, unknown>,
  context: ValidationContext,
) => Promise<string | true>;

type TDocumentMockRule = {
  fn?: TDocumentCustomFn;
  custom: (fn: TDocumentCustomFn) => TDocumentMockRule;
};

const createDocumentMockRule = (fn?: TDocumentCustomFn): TDocumentMockRule => ({
  fn,
  custom: (nextFn) => createDocumentMockRule(nextFn),
});

const buildTaxonomyKindRule = (
  schema: SchemaTypeDefinition,
): TDocumentMockRule => {
  if (!schema.validation) {
    throw new Error(`Expected ${schema.name} to define a validation rule.`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
  return (schema.validation as any)(
    createDocumentMockRule(),
  ) as TDocumentMockRule;
};

const fixtures = [
  {
    schemaName: 'tagIndexPageSchema',
    schema: tagIndexPageSchema,
    kind: TAXONOMY_KIND.TAGS,
    otherKind: TAXONOMY_KIND.TOPICS,
    mismatchError: 'This page lists tags; the module is set to topics.',
    previewSubtitle: 'Tag index singleton',
  },
  {
    schemaName: 'topicIndexPageSchema',
    schema: topicIndexPageSchema,
    kind: TAXONOMY_KIND.TOPICS,
    otherKind: TAXONOMY_KIND.TAGS,
    mismatchError: 'This page lists topics; the module is set to tags.',
    previewSubtitle: 'Topic index singleton',
  },
];

describe.each(fixtures)(
  '$schemaName',
  ({ schemaName, schema, kind, otherKind, mismatchError, previewSubtitle }) => {
    it(`preview reports "${previewSubtitle}"`, () => {
      if (!schema.preview?.prepare) {
        throw new Error(`Expected ${schemaName} to define a preview.prepare.`);
      }

      expect(schema.preview.prepare({ title: 'My Page' })).toEqual({
        title: 'My Page',
        subtitle: previewSubtitle,
      });
    });

    it('taxonomy-kind rule passes when the modules[] taxonomy list matches the page kind', async () => {
      const { fn: taxonomyKindFn } = buildTaxonomyKindRule(schema);
      const context = {
        getClient: () => ({
          withConfig: () => ({
            fetch: async () => [{ taxonomy: kind }],
          }),
        }),
      } as unknown as ValidationContext;

      await expect(
        taxonomyKindFn?.(
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
      const { fn: taxonomyKindFn } = buildTaxonomyKindRule(schema);
      const context = {
        getClient: () => ({
          withConfig: () => ({
            fetch: async () => [{ taxonomy: otherKind }],
          }),
        }),
      } as unknown as ValidationContext;

      await expect(
        taxonomyKindFn?.(
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
      const { fn: taxonomyKindFn } = buildTaxonomyKindRule(schema);
      const context = {
        getClient: () => ({
          withConfig: () => ({
            fetch: async () => [{ taxonomy: otherKind }],
          }),
        }),
      } as unknown as ValidationContext;

      await expect(
        taxonomyKindFn?.(
          { taxonomyList: { _ref: 'taxonomy-list-legacy' } },
          context,
        ),
      ).resolves.toBe(mismatchError);
    });
  },
);
