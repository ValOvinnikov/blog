import { faker } from '@faker-js/faker';

import {
  headingFieldsToSectionHeader,
  postListTitleToSectionHeader,
} from './transform';

faker.seed(7);

const MOCK_HEADING = faker.lorem.words();
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();
const MOCK_TITLE = faker.lorem.words();

describe(headingFieldsToSectionHeader, () => {
  it.each(['text', 'description'])(
    'maps heading and %s onto heading and supportingText',
    (supportingField) => {
      const result = headingFieldsToSectionHeader({
        heading: MOCK_HEADING,
        [supportingField]: MOCK_SUPPORTING_TEXT,
      });

      expect(result).toEqual({
        heading: MOCK_HEADING,
        supportingText: MOCK_SUPPORTING_TEXT,
      });
    },
  );

  it('omits supportingText when there is no text or description', () => {
    const result = headingFieldsToSectionHeader({ heading: MOCK_HEADING });

    expect(result).toEqual({ heading: MOCK_HEADING });
  });

  it('leaves a doc that already has sectionHeader alone', () => {
    const result = headingFieldsToSectionHeader({
      heading: MOCK_HEADING,
      sectionHeader: { heading: MOCK_HEADING },
    });

    expect(result).toBeUndefined();
  });

  it('returns undefined when there is nothing to move', () => {
    const result = headingFieldsToSectionHeader({});

    expect(result).toBeUndefined();
  });
});

describe(postListTitleToSectionHeader, () => {
  it('copies title onto the section header heading', () => {
    const result = postListTitleToSectionHeader({ title: MOCK_TITLE });

    expect(result).toEqual({ heading: MOCK_TITLE });
  });

  it('leaves a doc that already has sectionHeader alone', () => {
    const result = postListTitleToSectionHeader({
      title: MOCK_TITLE,
      sectionHeader: { heading: MOCK_TITLE },
    });

    expect(result).toBeUndefined();
  });

  it('returns undefined for a doc without a title', () => {
    const result = postListTitleToSectionHeader({});

    expect(result).toBeUndefined();
  });
});
