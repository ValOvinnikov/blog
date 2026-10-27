import { TAXONOMY_KIND } from '@blog/config/constants';
import { validateTaxonomyListReferencesMatchKind } from '@blog/studio/schema-types/validation/validate-taxonomy-list-matches-kind/validate-taxonomy-list-matches-kind';
import { mockDocument } from '@blog/studio/testing/mock-documents';
import { MOCK_FETCH_ERROR } from '@blog/studio/testing/mock-fetch-error';
import {
  mockFetchContext,
  type TMockFetchContext,
} from '@blog/studio/testing/mock-validation-context';
import { faker } from '@faker-js/faker';

faker.seed(6021);

const MODULE_TYPE_NAME = 'module_taxonomyList';
const MODULES_FIELD = 'modules';
const LEGACY_FIELD = 'taxonomyList';

const MOCK_TAXONOMY_LIST_ID = faker.string.uuid();
const MOCK_MODULE_KEY = faker.string.alphanumeric(8);
const MOCK_MISMATCH_ERROR = faker.lorem.sentence();

const modulesDocument = mockDocument({
  [MODULES_FIELD]: [
    {
      _key: MOCK_MODULE_KEY,
      _type: MODULE_TYPE_NAME,
      _ref: MOCK_TAXONOMY_LIST_ID,
    },
  ],
});
const legacyDocument = mockDocument({
  [LEGACY_FIELD]: { _ref: MOCK_TAXONOMY_LIST_ID },
});

describe(validateTaxonomyListReferencesMatchKind, () => {
  let validate: ReturnType<typeof validateTaxonomyListReferencesMatchKind>;

  beforeEach(() => {
    validate = validateTaxonomyListReferencesMatchKind(
      TAXONOMY_KIND.TOPICS,
      MODULE_TYPE_NAME,
      MOCK_MISMATCH_ERROR,
    );
  });

  describe('when the page references no taxonomy list', () => {
    let context: TMockFetchContext['context'];
    let fetchCalls: TMockFetchContext['fetchCalls'];

    beforeEach(() => {
      ({ context, fetchCalls } = mockFetchContext([]));
    });

    it.each([
      { case: 'no reference at all', document: mockDocument({}) },
      {
        case: 'only modules of another type',
        document: mockDocument({
          [MODULES_FIELD]: [
            {
              _key: MOCK_MODULE_KEY,
              _type: 'module_cta',
              _ref: faker.string.uuid(),
            },
          ],
        }),
      },
    ])('passes a page with $case without querying', async ({ document }) => {
      await expect(validate(document, context)).resolves.toBe(true);
      expect(fetchCalls).toHaveLength(0);
    });
  });

  describe('when the referenced list is of the other kind', () => {
    let context: TMockFetchContext['context'];
    let fetchCalls: TMockFetchContext['fetchCalls'];

    beforeEach(() => {
      ({ context, fetchCalls } = mockFetchContext([
        { _id: MOCK_TAXONOMY_LIST_ID, taxonomy: TAXONOMY_KIND.TAGS },
      ]));
    });

    it('fails on the mismatching modules entry', async () => {
      await expect(validate(modulesDocument, context)).resolves.toEqual([
        {
          message: MOCK_MISMATCH_ERROR,
          path: [MODULES_FIELD, { _key: MOCK_MODULE_KEY }],
        },
      ]);
    });

    it('points at the array index of a mismatching entry with no key', async () => {
      const unkeyedDocument = mockDocument({
        [MODULES_FIELD]: [
          { _type: MODULE_TYPE_NAME, _ref: MOCK_TAXONOMY_LIST_ID },
        ],
      });

      await expect(validate(unkeyedDocument, context)).resolves.toEqual([
        { message: MOCK_MISMATCH_ERROR, path: [MODULES_FIELD, 0] },
      ]);
    });

    it('fails on the mismatching legacy field', async () => {
      await expect(validate(legacyDocument, context)).resolves.toEqual([
        { message: MOCK_MISMATCH_ERROR, path: [LEGACY_FIELD] },
      ]);
    });

    describe('and both the legacy field and a module reference it', () => {
      let sharedDocument: ReturnType<typeof mockDocument>;

      beforeEach(() => {
        sharedDocument = mockDocument({
          ...legacyDocument,
          ...modulesDocument,
        });
      });

      it('reports the mismatch at both locations', async () => {
        await expect(validate(sharedDocument, context)).resolves.toEqual([
          { message: MOCK_MISMATCH_ERROR, path: [LEGACY_FIELD] },
          {
            message: MOCK_MISMATCH_ERROR,
            path: [MODULES_FIELD, { _key: MOCK_MODULE_KEY }],
          },
        ]);
      });

      it('looks the shared list up once', async () => {
        await validate(sharedDocument, context);

        expect(fetchCalls).toHaveLength(1);
        expect(fetchCalls[0]?.params).toEqual({
          ids: [MOCK_TAXONOMY_LIST_ID],
        });
      });
    });
  });

  it('passes when the legacy reference matches the page kind', async () => {
    const { context } = mockFetchContext([
      { _id: MOCK_TAXONOMY_LIST_ID, taxonomy: TAXONOMY_KIND.TOPICS },
    ]);

    await expect(validate(legacyDocument, context)).resolves.toBe(true);
  });

  it('passes when the referenced list has no kind set', async () => {
    const { context } = mockFetchContext([
      { _id: MOCK_TAXONOMY_LIST_ID, taxonomy: undefined },
    ]);

    await expect(validate(modulesDocument, context)).resolves.toBe(true);
  });

  it('passes when the fetch fails', async () => {
    const { context } = mockFetchContext(MOCK_FETCH_ERROR);

    await expect(validate(modulesDocument, context)).resolves.toBe(true);
  });
});
