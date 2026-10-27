import { PAGE_TAG_INDEX_TYPE } from '@blog/studio/schema-types/documents/pages/tag-index/tag-index-type';
import { PAGE_TOPIC_INDEX_TYPE } from '@blog/studio/schema-types/documents/pages/topic-index/topic-index-type';
import { faker } from '@faker-js/faker';
import { at, set, setIfMissing, unset } from 'sanity/migrate';

import migration, {
  buildLegacyIndexHeadingPatches,
  type TLegacyIndexHeadingDoc,
} from './index';

faker.seed(6018);

const MOCK_DOCUMENT_ID = faker.string.uuid();
const MOCK_HEADING = faker.lorem.words();
const MOCK_SUPPORTING_TEXT = faker.lorem.words();
const MOCK_LEGACY_COPY = faker.lorem.words();

const runDocument = (doc: Record<string, unknown>) =>
  migration.migrate.document?.(
    // @ts-expect-error -- only the fields the migration reads are needed
    doc,
  );

describe(buildLegacyIndexHeadingPatches, () => {
  it('moves an orphaned heading into headingBlock, then unsets it', () => {
    const doc: TLegacyIndexHeadingDoc = { heading: MOCK_HEADING };

    expect(buildLegacyIndexHeadingPatches(doc)).toEqual([
      at('headingBlock', setIfMissing({})),
      at('headingBlock.heading', set(MOCK_HEADING)),
      at('heading', unset()),
    ]);
  });

  it('moves an orphaned supportingText into headingBlock, then unsets it', () => {
    const doc: TLegacyIndexHeadingDoc = {
      supportingText: MOCK_SUPPORTING_TEXT,
    };

    expect(buildLegacyIndexHeadingPatches(doc)).toEqual([
      at('headingBlock', setIfMissing({})),
      at('headingBlock.supportingText', set(MOCK_SUPPORTING_TEXT)),
      at('supportingText', unset()),
    ]);
  });

  it('moves both fields across in one pass when both are orphaned', () => {
    const doc: TLegacyIndexHeadingDoc = {
      heading: MOCK_HEADING,
      supportingText: MOCK_SUPPORTING_TEXT,
    };

    expect(buildLegacyIndexHeadingPatches(doc)).toEqual([
      at('headingBlock', setIfMissing({})),
      at('headingBlock.heading', set(MOCK_HEADING)),
      at('headingBlock.supportingText', set(MOCK_SUPPORTING_TEXT)),
      at('heading', unset()),
      at('supportingText', unset()),
    ]);
  });

  it.each<[string, TLegacyIndexHeadingDoc]>([
    [
      'heading',
      { heading: MOCK_LEGACY_COPY, headingBlock: { heading: MOCK_HEADING } },
    ],
    [
      'supportingText',
      {
        supportingText: MOCK_LEGACY_COPY,
        headingBlock: { supportingText: MOCK_SUPPORTING_TEXT },
      },
    ],
  ])(
    'only unsets the legacy %s when headingBlock already has its own value',
    (field, doc) => {
      expect(buildLegacyIndexHeadingPatches(doc)).toEqual([at(field, unset())]);
    },
  );

  it('unsets a blank legacy heading without touching headingBlock', () => {
    const doc: TLegacyIndexHeadingDoc = { heading: '' };

    expect(buildLegacyIndexHeadingPatches(doc)).toEqual([
      at('heading', unset()),
    ]);
  });

  it('produces no patches once both legacy fields are already absent', () => {
    const doc: TLegacyIndexHeadingDoc = {
      headingBlock: { heading: MOCK_HEADING },
    };

    expect(buildLegacyIndexHeadingPatches(doc)).toEqual([]);
  });
});

describe('drop-deprecated-index-heading-fields migration', () => {
  it.each([PAGE_TAG_INDEX_TYPE, PAGE_TOPIC_INDEX_TYPE])(
    'moves an orphaned %s heading across before unsetting it',
    (type) => {
      const result = runDocument({
        _id: MOCK_DOCUMENT_ID,
        _type: type,
        heading: MOCK_HEADING,
      });

      expect(result).toEqual([
        at('headingBlock', setIfMissing({})),
        at('headingBlock.heading', set(MOCK_HEADING)),
        at('heading', unset()),
      ]);
    },
  );

  it('is a clean no-op once already migrated', () => {
    const result = runDocument({
      _id: MOCK_DOCUMENT_ID,
      _type: PAGE_TAG_INDEX_TYPE,
      headingBlock: { heading: MOCK_HEADING },
    });

    expect(result).toEqual([]);
  });
});
