import { mockEnglishString } from '@blog/studio/testing/migrations/localized';
import { faker } from '@faker-js/faker';
import { at, set } from 'sanity/migrate';

import { localizeBrandTaglineItems } from './index';

faker.seed(19);

const MOCK_FIRST_TEXT = faker.lorem.words(2);
const MOCK_SECOND_TEXT = faker.lorem.word();

const mockItem = (key: string, text: string) => ({
  _key: key,
  _type: 'brandTaglineItem',
  text: mockEnglishString(text),
});

const MOCK_FIRST_ITEM = mockItem('item-1', MOCK_FIRST_TEXT);
const MOCK_SECOND_ITEM = mockItem('item-2', MOCK_SECOND_TEXT);

describe(localizeBrandTaglineItems, () => {
  it('turns each tagline item into an item object with its text in the default language', () => {
    expect(
      localizeBrandTaglineItems({
        brand: { tagline: { items: [MOCK_FIRST_TEXT, MOCK_SECOND_TEXT] } },
      }),
    ).toEqual([
      at(
        ['brand', 'tagline', 'items'],
        set([MOCK_FIRST_ITEM, MOCK_SECOND_ITEM]),
      ),
    ]);
  });

  it.each([
    {
      name: 'already localized items',
      doc: {
        brand: { tagline: { items: [MOCK_FIRST_ITEM, MOCK_SECOND_ITEM] } },
      },
    },
    { name: 'settings with an empty brand', doc: { brand: {} } },
    { name: 'settings without a brand', doc: {} },
  ])('leaves $name alone', ({ doc }) => {
    expect(localizeBrandTaglineItems(doc)).toBeUndefined();
  });
});
