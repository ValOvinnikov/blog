import { faker } from '@faker-js/faker';
import { at, set, unset } from 'sanity/migrate';

import {
  moveHeroStatementHeadingFields,
  renameRequiredHeadingBlockType,
} from './index';

faker.seed(5105);

const MOCK_HEADING = faker.lorem.words();
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();
const MOCK_MOVED_HEADING = faker.lorem.words();

describe(renameRequiredHeadingBlockType, () => {
  it('rewrites headingBlock._type to headingBlock', () => {
    const result = renameRequiredHeadingBlockType({
      headingBlock: { _type: 'requiredHeadingBlock' },
    });

    expect(result).toEqual([at('headingBlock._type', set('headingBlock'))]);
  });

  it.each([
    [
      'a doc already on headingBlock',
      { headingBlock: { _type: 'headingBlock' } },
    ],
    ['a doc with no headingBlock', {}],
  ])('produces no patch for %s', (_name, doc) => {
    const result = renameRequiredHeadingBlockType(doc);

    expect(result).toBeUndefined();
  });
});

describe(moveHeroStatementHeadingFields, () => {
  it('moves heading and supportingText onto headingBlock, then unsets both', () => {
    const result = moveHeroStatementHeadingFields({
      heading: MOCK_HEADING,
      supportingText: MOCK_SUPPORTING_TEXT,
    });

    expect(result).toEqual([
      at(
        'headingBlock',
        set({
          _type: 'headingBlock',
          heading: MOCK_HEADING,
          supportingText: MOCK_SUPPORTING_TEXT,
        }),
      ),
      at('heading', unset()),
      at('supportingText', unset()),
    ]);
  });

  it('leaves supportingText out of the value and the unsets when absent', () => {
    const result = moveHeroStatementHeadingFields({ heading: MOCK_HEADING });

    expect(result).toEqual([
      at('headingBlock', set({ _type: 'headingBlock', heading: MOCK_HEADING })),
      at('heading', unset()),
    ]);
  });

  it.each([
    [
      'a doc already on headingBlock, legacy fields included',
      {
        heading: MOCK_HEADING,
        headingBlock: { _type: 'headingBlock', heading: MOCK_MOVED_HEADING },
      },
    ],
    ['a doc with neither heading nor headingBlock', {}],
  ])('produces no patch for %s', (_name, doc) => {
    const result = moveHeroStatementHeadingFields(doc);

    expect(result).toBeUndefined();
  });
});
