import type { ArticleText } from '@blog/config';
import {
  LOCALE_ISO_CODES,
  PORTABLE_TEXT_BLOCK_TYPE,
} from '@blog/config/constants';
import { q } from '@blog/service/sanity/query/query';
import {
  MOCK_LINK_LABEL,
  mockReference,
} from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { mockLocalizedLinkDocument } from '@blog/service/testing/shared/localized';
import { faker } from '@faker-js/faker';

import { portableTextBodyItemFragment } from './portable-text-body-item';

faker.seed(6517);

const { EN } = LOCALE_ISO_CODES;

const MOCK_COOKIE_LIST_KEY = faker.string.uuid();
const MOCK_SECTION_KEY = faker.string.uuid();
const MOCK_SECTION_TITLE = faker.lorem.words(3);
const MOCK_BLOCK_KEY = faker.string.uuid();
const MOCK_MARK_KEY = faker.string.uuid();
const MOCK_LINK_ID = faker.string.uuid();

const bodyItemQuery = q.star
  .filterByType(
    PORTABLE_TEXT_BLOCK_TYPE.COOKIE_LIST,
    PORTABLE_TEXT_BLOCK_TYPE.EXPANDABLE_SECTION,
  )
  .slice(0)
  .as<ArticleText[number]>()
  .project(portableTextBodyItemFragment);

async function projectBodyItem(item: Record<string, unknown>) {
  const raw = await evaluateGroqExpression(
    bodyItemQuery.query,
    [item, mockLocalizedLinkDocument(MOCK_LINK_ID, MOCK_LINK_LABEL)],
    undefined,
    { locale: EN, defaultLocale: EN },
  );

  return bodyItemQuery.parse(raw);
}

describe('portableTextBodyItemFragment', () => {
  it('projects a cookie-list block as a cookie-list block', async () => {
    const item = await projectBodyItem({
      _type: PORTABLE_TEXT_BLOCK_TYPE.COOKIE_LIST,
      _key: MOCK_COOKIE_LIST_KEY,
    });

    expect(item).toMatchObject({
      _type: PORTABLE_TEXT_BLOCK_TYPE.COOKIE_LIST,
      _key: MOCK_COOKIE_LIST_KEY,
    });
  });

  it('projects an expandable section with its title and the links in its body resolved', async () => {
    const item = await projectBodyItem({
      _type: PORTABLE_TEXT_BLOCK_TYPE.EXPANDABLE_SECTION,
      _key: MOCK_SECTION_KEY,
      title: MOCK_SECTION_TITLE,
      body: [
        {
          _type: 'block',
          _key: MOCK_BLOCK_KEY,
          children: [],
          markDefs: [
            {
              _type: PORTABLE_TEXT_BLOCK_TYPE.LINK_REF,
              _key: MOCK_MARK_KEY,
              link: mockReference(MOCK_LINK_ID),
            },
          ],
        },
      ],
    });

    expect(item).toMatchObject({
      _type: PORTABLE_TEXT_BLOCK_TYPE.EXPANDABLE_SECTION,
      _key: MOCK_SECTION_KEY,
      title: MOCK_SECTION_TITLE,
      body: [
        {
          _key: MOCK_BLOCK_KEY,
          markDefs: [{ _key: MOCK_MARK_KEY, link: { label: MOCK_LINK_LABEL } }],
        },
      ],
    });
  });
});
