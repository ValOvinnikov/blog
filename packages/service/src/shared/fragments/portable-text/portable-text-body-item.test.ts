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
const MOCK_TABLE_KEY = faker.string.uuid();
const MOCK_ROW_KEY = faker.string.uuid();
const MOCK_CELL_KEY = faker.string.uuid();
const MOCK_CELL_TEXT = faker.lorem.words(2);
const MOCK_HEADER_ROWS = 1;

const bodyItemQuery = q.star
  .filterByType(
    PORTABLE_TEXT_BLOCK_TYPE.COOKIE_LIST,
    PORTABLE_TEXT_BLOCK_TYPE.EXPANDABLE_SECTION,
    PORTABLE_TEXT_BLOCK_TYPE.TABLE,
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

  it('projects a table with its header-row count and the links in its cells resolved', async () => {
    const item = await projectBodyItem({
      _type: PORTABLE_TEXT_BLOCK_TYPE.TABLE,
      _key: MOCK_TABLE_KEY,
      headerRows: MOCK_HEADER_ROWS,
      rows: [
        {
          _type: 'row',
          _key: MOCK_ROW_KEY,
          cells: [
            {
              _type: 'cell',
              _key: MOCK_CELL_KEY,
              value: [
                {
                  _type: 'block',
                  _key: MOCK_BLOCK_KEY,
                  children: [
                    {
                      _type: 'span',
                      _key: MOCK_MARK_KEY,
                      text: MOCK_CELL_TEXT,
                      marks: [MOCK_MARK_KEY],
                    },
                  ],
                  markDefs: [
                    {
                      _type: PORTABLE_TEXT_BLOCK_TYPE.LINK_REF,
                      _key: MOCK_MARK_KEY,
                      link: mockReference(MOCK_LINK_ID),
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    expect(item).toMatchObject({
      _type: PORTABLE_TEXT_BLOCK_TYPE.TABLE,
      _key: MOCK_TABLE_KEY,
      headerRows: MOCK_HEADER_ROWS,
      rows: [
        {
          _key: MOCK_ROW_KEY,
          cells: [
            {
              _key: MOCK_CELL_KEY,
              value: [
                {
                  _key: MOCK_BLOCK_KEY,
                  children: [{ text: MOCK_CELL_TEXT }],
                  markDefs: [
                    { _key: MOCK_MARK_KEY, link: { label: MOCK_LINK_LABEL } },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
  });
});
