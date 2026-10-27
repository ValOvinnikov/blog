import { faker } from '@faker-js/faker';
import { at, setIfMissing, unset } from 'sanity/migrate';

import {
  moveHeadingFieldsToSectionHeader,
  movePostListTitleToSectionHeader,
} from './index';

faker.seed(6);

const MOCK_HEADING = faker.lorem.words();
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();
const MOCK_TITLE = faker.lorem.words();

describe(moveHeadingFieldsToSectionHeader, () => {
  it.each(['text', 'description'])(
    'moves heading and %s onto sectionHeader and unsets both',
    (supportingField) => {
      const result = moveHeadingFieldsToSectionHeader({
        heading: MOCK_HEADING,
        [supportingField]: MOCK_SUPPORTING_TEXT,
      });

      expect(result).toEqual([
        at(
          'sectionHeader',
          setIfMissing({
            heading: MOCK_HEADING,
            supportingText: MOCK_SUPPORTING_TEXT,
          }),
        ),
        at('heading', unset()),
        at(supportingField, unset()),
      ]);
    },
  );

  it('only unsets fields that were present on the doc', () => {
    const result = moveHeadingFieldsToSectionHeader({ heading: MOCK_HEADING });

    expect(result).toEqual([
      at('sectionHeader', setIfMissing({ heading: MOCK_HEADING })),
      at('heading', unset()),
    ]);
  });

  it('leaves an already migrated doc alone', () => {
    const result = moveHeadingFieldsToSectionHeader({
      heading: MOCK_HEADING,
      text: MOCK_SUPPORTING_TEXT,
      sectionHeader: {
        heading: MOCK_HEADING,
        supportingText: MOCK_SUPPORTING_TEXT,
      },
    });

    expect(result).toBeUndefined();
  });
});

describe(movePostListTitleToSectionHeader, () => {
  it('copies title onto sectionHeader and keeps title', () => {
    const result = movePostListTitleToSectionHeader({ title: MOCK_TITLE });

    expect(result).toEqual([
      at('sectionHeader', setIfMissing({ heading: MOCK_TITLE })),
    ]);
  });

  it('leaves an already migrated doc alone', () => {
    const result = movePostListTitleToSectionHeader({
      title: MOCK_TITLE,
      sectionHeader: { heading: MOCK_TITLE },
    });

    expect(result).toBeUndefined();
  });
});
