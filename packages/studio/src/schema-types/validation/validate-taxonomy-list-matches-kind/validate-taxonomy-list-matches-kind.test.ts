import { TAXONOMY_KIND } from '@blog/config/constants';
import { validateTaxonomyListReferencesMatchKind } from '@blog/studio/schema-types/validation/validate-taxonomy-list-matches-kind/validate-taxonomy-list-matches-kind';
import type { SanityDocument, ValidationContext } from 'sanity';

const MISMATCH_ERROR = 'This page lists topics; the module is set to tags.';
const MODULE_TYPE_NAME = 'module_taxonomyList';

const asDocument = (doc: Record<string, unknown>): SanityDocument =>
  doc as unknown as SanityDocument;

const createMockListContext = (modules: { taxonomy?: string | null }[]) => {
  const fetchCalls: { query: string; params: unknown }[] = [];

  const context = {
    getClient: () => ({
      withConfig: () => ({
        fetch: async (query: string, params: unknown) => {
          fetchCalls.push({ query, params });
          return modules;
        },
      }),
    }),
  } as unknown as ValidationContext;

  return { context, fetchCalls };
};

describe('validateTaxonomyListReferencesMatchKind', () => {
  it('passes when neither the legacy field nor modules[] references anything, without querying', async () => {
    const validate = validateTaxonomyListReferencesMatchKind(
      TAXONOMY_KIND.TOPICS,
      MODULE_TYPE_NAME,
      MISMATCH_ERROR,
    );
    const { context, fetchCalls } = createMockListContext([]);

    await expect(validate(asDocument({}), context)).resolves.toBe(true);
    expect(fetchCalls).toHaveLength(0);
  });

  it('passes when the legacy taxonomyList reference matches the page kind', async () => {
    const validate = validateTaxonomyListReferencesMatchKind(
      TAXONOMY_KIND.TOPICS,
      MODULE_TYPE_NAME,
      MISMATCH_ERROR,
    );
    const { context } = createMockListContext([
      { taxonomy: TAXONOMY_KIND.TOPICS },
    ]);
    const document = asDocument({ taxonomyList: { _ref: 'taxonomy-list-1' } });

    await expect(validate(document, context)).resolves.toBe(true);
  });

  it('passes when the modules[] entry has no taxonomy set', async () => {
    const validate = validateTaxonomyListReferencesMatchKind(
      TAXONOMY_KIND.TOPICS,
      MODULE_TYPE_NAME,
      MISMATCH_ERROR,
    );
    const { context } = createMockListContext([{ taxonomy: undefined }]);
    const document = asDocument({
      modules: [
        { _key: 'k1', _type: MODULE_TYPE_NAME, _ref: 'taxonomy-list-1' },
      ],
    });

    await expect(validate(document, context)).resolves.toBe(true);
  });

  it('fails when a modules[] entry lists the other kind', async () => {
    const validate = validateTaxonomyListReferencesMatchKind(
      TAXONOMY_KIND.TOPICS,
      MODULE_TYPE_NAME,
      MISMATCH_ERROR,
    );
    const { context } = createMockListContext([
      { taxonomy: TAXONOMY_KIND.TAGS },
    ]);
    const document = asDocument({
      modules: [
        { _key: 'k1', _type: MODULE_TYPE_NAME, _ref: 'taxonomy-list-1' },
      ],
    });

    await expect(validate(document, context)).resolves.toBe(MISMATCH_ERROR);
  });

  it('fails when the deprecated legacy field lists the other kind, even alongside modules[]', async () => {
    const validate = validateTaxonomyListReferencesMatchKind(
      TAXONOMY_KIND.TOPICS,
      MODULE_TYPE_NAME,
      MISMATCH_ERROR,
    );
    const { context } = createMockListContext([
      { taxonomy: TAXONOMY_KIND.TOPICS },
      { taxonomy: TAXONOMY_KIND.TAGS },
    ]);
    const document = asDocument({
      taxonomyList: { _ref: 'taxonomy-list-legacy' },
      modules: [
        { _key: 'k1', _type: MODULE_TYPE_NAME, _ref: 'taxonomy-list-legacy' },
      ],
    });

    await expect(validate(document, context)).resolves.toBe(MISMATCH_ERROR);
  });

  it('ignores modules[] entries of a different type', async () => {
    const validate = validateTaxonomyListReferencesMatchKind(
      TAXONOMY_KIND.TOPICS,
      MODULE_TYPE_NAME,
      MISMATCH_ERROR,
    );
    const { context, fetchCalls } = createMockListContext([]);
    const document = asDocument({
      modules: [{ _key: 'k1', _type: 'module_cta', _ref: 'cta-1' }],
    });

    await expect(validate(document, context)).resolves.toBe(true);
    expect(fetchCalls).toHaveLength(0);
  });

  it('deduplicates a ref shared by the legacy field and modules[]', async () => {
    const validate = validateTaxonomyListReferencesMatchKind(
      TAXONOMY_KIND.TOPICS,
      MODULE_TYPE_NAME,
      MISMATCH_ERROR,
    );
    const { context, fetchCalls } = createMockListContext([
      { taxonomy: TAXONOMY_KIND.TOPICS },
    ]);
    const document = asDocument({
      taxonomyList: { _ref: 'taxonomy-list-1' },
      modules: [
        { _key: 'k1', _type: MODULE_TYPE_NAME, _ref: 'taxonomy-list-1' },
      ],
    });

    await validate(document, context);

    expect(fetchCalls[0]?.params).toEqual({ ids: ['taxonomy-list-1'] });
  });
});
