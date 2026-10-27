import { LINK_TYPE } from '@blog/config';
import {
  LOCALE_ISO_CODES,
  PORTABLE_TEXT_BLOCK_TYPE,
} from '@blog/config/constants';
import {
  MOCK_MISSING_ID,
  mockReference,
} from '@blog/service/testing/shared/fixtures';
import { evaluateGroqInLocale } from '@blog/service/testing/shared/groq';
import { mockLocalizedStrings } from '@blog/service/testing/shared/localized';
import { faker } from '@faker-js/faker';

import { navigationQuery } from './query';

faker.seed(6075);

const { EN } = LOCALE_ISO_CODES;

const MOCK_PARENT_LINK_ID = faker.string.uuid();
const MOCK_SUB_LINK_ID = faker.string.uuid();
const MOCK_SUB_LABEL = faker.lorem.word();

function mockLinkDocument(_id: string, label: string) {
  return {
    _id,
    _type: 'link',
    linkType: LINK_TYPE.EXTERNAL,
    label: mockLocalizedStrings({ [EN]: label }),
    url: mockLocalizedStrings({ [EN]: faker.internet.url() }),
  };
}

const MOCK_NAVIGATION_DOCUMENT = {
  _id: faker.string.uuid(),
  _type: 'settings_navigation',
  items: [
    {
      _key: faker.string.uuid(),
      _type: 'linkRefWithSubItems',
      link: mockReference(MOCK_PARENT_LINK_ID),
      subItems: [
        {
          _key: faker.string.uuid(),
          _type: PORTABLE_TEXT_BLOCK_TYPE.LINK_REF,
          link: mockReference(MOCK_MISSING_ID),
        },
        {
          _key: faker.string.uuid(),
          _type: PORTABLE_TEXT_BLOCK_TYPE.LINK_REF,
          link: mockReference(MOCK_SUB_LINK_ID),
        },
      ],
    },
  ],
};

describe('navigationQuery', () => {
  it('resolves a sub-item whose link is missing to no link, keeping the rest', async () => {
    const raw = await evaluateGroqInLocale(
      navigationQuery.query,
      [
        MOCK_NAVIGATION_DOCUMENT,
        mockLinkDocument(MOCK_PARENT_LINK_ID, faker.lorem.word()),
        mockLinkDocument(MOCK_SUB_LINK_ID, MOCK_SUB_LABEL),
      ],
      EN,
    );

    const [item] = navigationQuery.parse(raw).items ?? [];

    expect(item && 'subItems' in item && item.subItems).toEqual([
      { link: null },
      { link: expect.objectContaining({ label: MOCK_SUB_LABEL }) },
    ]);
  });
});
