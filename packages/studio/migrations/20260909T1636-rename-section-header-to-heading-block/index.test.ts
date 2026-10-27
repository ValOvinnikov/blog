import { faker } from '@faker-js/faker';
import { at, set, unset } from 'sanity/migrate';

import { renameSectionHeaderToHeadingBlock } from './index';

faker.seed(1636);

const LEGACY_TYPE = 'sectionHeader';
const HEADING_BLOCK_TYPE = 'headingBlock';
const MOCK_HEADING = faker.lorem.words();
const MOCK_SUPPORTING_TEXT = faker.lorem.words();
const MOCK_MIGRATED_HEADING = faker.lorem.words();

describe(renameSectionHeaderToHeadingBlock, () => {
  it.each([
    {
      name: 'a plain sectionHeader',
      legacyType: LEGACY_TYPE,
      expectedType: HEADING_BLOCK_TYPE,
    },
    {
      name: 'a requiredHeadingSectionHeader',
      legacyType: 'requiredHeadingSectionHeader',
      expectedType: 'requiredHeadingBlock',
    },
  ])(
    'moves $name onto headingBlock with the renamed _type',
    ({ legacyType, expectedType }) => {
      const sectionHeader = {
        _type: legacyType,
        heading: MOCK_HEADING,
        supportingText: MOCK_SUPPORTING_TEXT,
      };

      const result = renameSectionHeaderToHeadingBlock({ sectionHeader });

      expect(result).toEqual([
        at(
          HEADING_BLOCK_TYPE,
          set({
            _type: expectedType,
            heading: MOCK_HEADING,
            supportingText: MOCK_SUPPORTING_TEXT,
          }),
        ),
        at(LEGACY_TYPE, unset()),
      ]);
    },
  );

  it.each([
    {
      name: 'a doc already migrated to headingBlock',
      doc: {
        headingBlock: {
          _type: HEADING_BLOCK_TYPE,
          heading: MOCK_MIGRATED_HEADING,
        },
      },
    },
    {
      name: 'a doc with both fields set',
      doc: {
        sectionHeader: { _type: LEGACY_TYPE, heading: MOCK_HEADING },
        headingBlock: {
          _type: HEADING_BLOCK_TYPE,
          heading: MOCK_MIGRATED_HEADING,
        },
      },
    },
    { name: 'a doc that never had a sectionHeader', doc: {} },
  ])('leaves $name alone', ({ doc }) => {
    const result = renameSectionHeaderToHeadingBlock(doc);

    expect(result).toBeUndefined();
  });
});
