import type {
  InternationalizedArrayArticleText,
  Module_content,
} from '@blog/config';
import {
  ASIDE_KIND,
  IMAGE_LAYOUT,
  LOCALE_ISO_CODES,
  PORTABLE_TEXT_BLOCK_TYPE,
} from '@blog/config/constants';
import { q } from '@blog/service/sanity/query/query';
import type { portableTextBodyItemFragment } from '@blog/service/shared/fragments/portable-text/portable-text-body-item';
import type { TLocalizedKey } from '@blog/service/shared/localization/get-localized-field/get-localized-field';
import type { TLocaleQueryParams } from '@blog/service/shared/localization/locale-query-params/locale-query-params';
import { MOCK_CONTENT_MODULE_ID } from '@blog/service/testing/modules/fixtures';
import { mockRawBodyImageBlock } from '@blog/service/testing/shared/fixtures';
import { createLocalizedFieldResolver } from '@blog/service/testing/shared/groq';
import {
  MOCK_DUTCH_TEXT,
  MOCK_ENGLISH_TEXT,
  mockLocalizedEntry,
  mockParagraphBlocks,
} from '@blog/service/testing/shared/localized';
import type { InferFragmentType } from 'groqd';

import { getLocalizedArticleText } from './get-localized-article-text';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const ENGLISH_ALT = 'A diagram';
const DUTCH_ALT = 'Een diagram';

const query = q
  .parameters<TLocaleQueryParams>()
  .star.filterByType('module_content')
  .slice(0)
  .project((sub) => ({
    body: getLocalizedArticleText(sub, 'body'),
  }));

const resolve = createLocalizedFieldResolver(query.query, (body) => ({
  _id: MOCK_CONTENT_MODULE_ID,
  _type: 'module_content',
  body,
}));

function article(text: string, alt: string) {
  return [
    ...mockParagraphBlocks(text),
    mockRawBodyImageBlock({ alt }),
    {
      _type: PORTABLE_TEXT_BLOCK_TYPE.ASIDE,
      _key: 'aside-1',
      kind: ASIDE_KIND.CONTEXT,
      body: mockParagraphBlocks(`${text} Aside.`),
    },
  ];
}

const english = mockLocalizedEntry(EN, article(MOCK_ENGLISH_TEXT, ENGLISH_ALT));
const dutch = mockLocalizedEntry(NL, article(MOCK_DUTCH_TEXT, DUTCH_ALT));

describe(getLocalizedArticleText, () => {
  it('resolves the text, images and asides in the requested language', async () => {
    const result = await resolve([english, dutch], NL);

    expect(result).toMatchObject({
      body: [
        { _type: 'block', children: [{ text: MOCK_DUTCH_TEXT }] },
        {
          _type: PORTABLE_TEXT_BLOCK_TYPE.BODY_IMAGE,
          alt: DUTCH_ALT,
          layout: IMAGE_LAYOUT.FULL_BLEED,
        },
        {
          _type: PORTABLE_TEXT_BLOCK_TYPE.ASIDE,
          body: [{ children: [{ text: `${MOCK_DUTCH_TEXT} Aside.` }] }],
        },
      ],
    });
  });

  it('falls back to the default language when the requested one is missing', async () => {
    const result = await resolve([english, dutch], FR);

    expect(result).toMatchObject({
      body: [
        { _type: 'block', children: [{ text: MOCK_ENGLISH_TEXT }] },
        { _type: PORTABLE_TEXT_BLOCK_TYPE.BODY_IMAGE, alt: ENGLISH_ALT },
        {
          _type: PORTABLE_TEXT_BLOCK_TYPE.ASIDE,
          body: [{ children: [{ text: `${MOCK_ENGLISH_TEXT} Aside.` }] }],
        },
      ],
    });
  });

  it('resolves to nothing when neither language has a body', async () => {
    const result = await resolve([dutch], FR);

    expect(result).toEqual({ body: null });
  });
});

describe('getLocalizedArticleText types', () => {
  it('infers the projected article items', () => {
    type TResult = NonNullable<ReturnType<typeof query.parse>>;

    expectTypeOf<TResult['body']>().toEqualTypeOf<
      InferFragmentType<typeof portableTextBodyItemFragment>[] | null
    >();
  });

  it('accepts only localized article-text fields as the field name', () => {
    expectTypeOf<
      TLocalizedKey<Module_content, InternationalizedArrayArticleText>
    >().toEqualTypeOf<'body'>();
  });
});
