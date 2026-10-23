import { TAXONOMY_KIND } from '@blog/config/constants';
import { validateTaxonomyListReferencesMatchKind } from '@blog/studio/schema-types/validation/validate-taxonomy-list-matches-kind/validate-taxonomy-list-matches-kind';
import { mockDocument } from '@blog/studio/testing/mock-documents';
import {
  mockFetchContext,
  type TMockFetchContext,
} from '@blog/studio/testing/mock-validation-context';

const TAXONOMY_LIST_ID = 'taxonomy-list-1';
const LEGACY_TAXONOMY_LIST_ID = 'taxonomy-list-legacy';

const MISMATCH_ERROR = 'This page lists topics; the module is set to tags.';
const MODULE_TYPE_NAME = 'module_taxonomyList';

describe('validateTaxonomyListReferencesMatchKind', () => {
  let validate: ReturnType<typeof validateTaxonomyListReferencesMatchKind>;

  beforeEach(() => {
    validate = validateTaxonomyListReferencesMatchKind(
      TAXONOMY_KIND.TOPICS,
      MODULE_TYPE_NAME,
      MISMATCH_ERROR,
    );
  });

  describe('when no taxonomy list exists', () => {
    let context: TMockFetchContext['context'];
    let fetchCalls: TMockFetchContext['fetchCalls'];

    beforeEach(() => {
      ({ context, fetchCalls } = mockFetchContext([]));
    });

    it('passes when neither the legacy field nor modules[] references anything, without querying', async () => {
      await expect(validate(mockDocument({}), context)).resolves.toBe(true);
      expect(fetchCalls).toHaveLength(0);
    });

    it('ignores modules[] entries of a different type', async () => {
      const document = mockDocument({
        modules: [{ _key: 'k1', _type: 'module_cta', _ref: 'cta-1' }],
      });

      await expect(validate(document, context)).resolves.toBe(true);
      expect(fetchCalls).toHaveLength(0);
    });
  });

  describe('when the list taxonomy-list-1 is of the tags kind', () => {
    let context: TMockFetchContext['context'];
    let fetchCalls: TMockFetchContext['fetchCalls'];

    beforeEach(() => {
      ({ context, fetchCalls } = mockFetchContext([
        { _id: TAXONOMY_LIST_ID, taxonomy: TAXONOMY_KIND.TAGS },
      ]));
    });

    it('fails when a modules[] entry lists the other kind, targeting that entry', async () => {
      const document = mockDocument({
        modules: [
          { _key: 'k1', _type: MODULE_TYPE_NAME, _ref: TAXONOMY_LIST_ID },
        ],
      });

      await expect(validate(document, context)).resolves.toEqual([
        { message: MISMATCH_ERROR, path: ['modules', { _key: 'k1' }] },
      ]);
    });

    it('falls back to the array index when a mismatching modules[] entry has no _key', async () => {
      const document = mockDocument({
        modules: [{ _type: MODULE_TYPE_NAME, _ref: TAXONOMY_LIST_ID }],
      });

      await expect(validate(document, context)).resolves.toEqual([
        { message: MISMATCH_ERROR, path: ['modules', 0] },
      ]);
    });

    it('deduplicates a ref shared by the legacy field and modules[] into one fetch, but reports both locations', async () => {
      const document = mockDocument({
        taxonomyList: { _ref: TAXONOMY_LIST_ID },
        modules: [
          { _key: 'k1', _type: MODULE_TYPE_NAME, _ref: TAXONOMY_LIST_ID },
        ],
      });

      await expect(validate(document, context)).resolves.toEqual([
        { message: MISMATCH_ERROR, path: ['taxonomyList'] },
        { message: MISMATCH_ERROR, path: ['modules', { _key: 'k1' }] },
      ]);
      expect(fetchCalls[0]?.params).toEqual({ ids: [TAXONOMY_LIST_ID] });
      expect(fetchCalls).toHaveLength(1);
    });
  });

  it('passes when the legacy taxonomyList reference matches the page kind', async () => {
    const { context } = mockFetchContext([
      { _id: TAXONOMY_LIST_ID, taxonomy: TAXONOMY_KIND.TOPICS },
    ]);
    const document = mockDocument({
      taxonomyList: { _ref: TAXONOMY_LIST_ID },
    });

    await expect(validate(document, context)).resolves.toBe(true);
  });

  it('passes when the modules[] entry has no taxonomy set', async () => {
    const { context } = mockFetchContext([
      { _id: TAXONOMY_LIST_ID, taxonomy: undefined },
    ]);
    const document = mockDocument({
      modules: [
        { _key: 'k1', _type: MODULE_TYPE_NAME, _ref: TAXONOMY_LIST_ID },
      ],
    });

    await expect(validate(document, context)).resolves.toBe(true);
  });

  it('fails when the deprecated legacy field lists the other kind, targeting that field', async () => {
    const { context } = mockFetchContext([
      { _id: LEGACY_TAXONOMY_LIST_ID, taxonomy: TAXONOMY_KIND.TAGS },
    ]);
    const document = mockDocument({
      taxonomyList: { _ref: LEGACY_TAXONOMY_LIST_ID },
    });

    await expect(validate(document, context)).resolves.toEqual([
      { message: MISMATCH_ERROR, path: ['taxonomyList'] },
    ]);
  });

  it('resolves to true, not an error, when the fetch rejects', async () => {
    const { context } = mockFetchContext(new Error('network down'));
    const document = mockDocument({
      modules: [
        { _key: 'k1', _type: MODULE_TYPE_NAME, _ref: TAXONOMY_LIST_ID },
      ],
    });

    await expect(validate(document, context)).resolves.toBe(true);
  });
});
