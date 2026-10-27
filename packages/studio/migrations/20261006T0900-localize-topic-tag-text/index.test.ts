import { mockEnglishText } from '@blog/studio/testing/migrations/localize';
import { mockEnglishString } from '@blog/studio/testing/migrations/localized';
import { faker } from '@faker-js/faker';
import { at, set } from 'sanity/migrate';

import { localizeTaxonomyText } from './index';

faker.seed(20);

const MOCK_TITLE = faker.lorem.word();
const MOCK_DESCRIPTION = faker.lorem.sentence();

describe(localizeTaxonomyText, () => {
  it('moves a title and description into the default language', () => {
    expect(
      localizeTaxonomyText({
        title: MOCK_TITLE,
        description: MOCK_DESCRIPTION,
      }),
    ).toEqual([
      at('title', set(mockEnglishString(MOCK_TITLE))),
      at('description', set(mockEnglishText(MOCK_DESCRIPTION))),
    ]);
  });

  it('localizes only the fields still holding plain text', () => {
    expect(
      localizeTaxonomyText({
        title: mockEnglishString(MOCK_TITLE),
        description: MOCK_DESCRIPTION,
      }),
    ).toEqual([at('description', set(mockEnglishText(MOCK_DESCRIPTION)))]);
  });

  it.each([
    {
      name: 'an already localized document',
      doc: {
        title: mockEnglishString(MOCK_TITLE),
        description: mockEnglishText(MOCK_DESCRIPTION),
      },
    },
    { name: 'a document without text', doc: {} },
  ])('leaves $name alone', ({ doc }) => {
    expect(localizeTaxonomyText(doc)).toBeUndefined();
  });
});
