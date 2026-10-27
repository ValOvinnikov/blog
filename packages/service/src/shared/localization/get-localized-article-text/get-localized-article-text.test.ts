import type {
  TMaybeNull,
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
import {
  MOCK_BODY_IMAGE_KEY,
  mockRawBodyImageBlock,
} from '@blog/service/testing/shared/fixtures';
import { createLocalizedFieldResolver } from '@blog/service/testing/shared/groq';
import {
  MOCK_DUTCH_TEXT,
  MOCK_ENGLISH_TEXT,
  mockLocalizedEntry,
  mockParagraphBlocks,
} from '@blog/service/testing/shared/localized';
import { faker } from '@faker-js/faker';
import type { InferFragmentType } from 'groqd';

import { getLocalizedArticleText } from './get-localized-article-text';

const { EN, NL, FR } = LOCALE_ISO_CODES;

faker.seed(6016);

const MOCK_ENGLISH_ALT = faker.lorem.sentence();
const MOCK_DUTCH_ALT = faker.lorem.sentence();
const MOCK_ASIDE_KEY = faker.string.uuid();

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

function mockArticleBody(text: string, alt: string) {
  return [
    ...mockParagraphBlocks(text),
    mockRawBodyImageBlock({ alt }),
    {
      _type: PORTABLE_TEXT_BLOCK_TYPE.ASIDE,
      _key: MOCK_ASIDE_KEY,
      kind: ASIDE_KIND.CONTEXT,
      body: mockParagraphBlocks(text),
    },
  ];
}

function mockResolvedArticleBody(text: string, alt: string) {
  return [
    ...mockParagraphBlocks(text),
    {
      _type: PORTABLE_TEXT_BLOCK_TYPE.BODY_IMAGE,
      _key: MOCK_BODY_IMAGE_KEY,
      alt,
      asset: null,
      crop: null,
      hotspot: null,
      layout: IMAGE_LAYOUT.FULL_BLEED,
    },
    {
      _type: PORTABLE_TEXT_BLOCK_TYPE.ASIDE,
      _key: MOCK_ASIDE_KEY,
      kind: ASIDE_KIND.CONTEXT,
      body: mockParagraphBlocks(text),
    },
  ];
}

const MOCK_ENGLISH_ENTRY = mockLocalizedEntry(
  EN,
  mockArticleBody(MOCK_ENGLISH_TEXT, MOCK_ENGLISH_ALT),
);
const MOCK_DUTCH_ENTRY = mockLocalizedEntry(
  NL,
  mockArticleBody(MOCK_DUTCH_TEXT, MOCK_DUTCH_ALT),
);

describe(getLocalizedArticleText, () => {
  it('resolves the text, images and asides in the requested language', async () => {
    const result = await resolve([MOCK_ENGLISH_ENTRY, MOCK_DUTCH_ENTRY], NL);

    expect(result).toEqual({
      body: mockResolvedArticleBody(MOCK_DUTCH_TEXT, MOCK_DUTCH_ALT),
    });
  });

  it('falls back to the default language when the requested one is missing', async () => {
    const result = await resolve([MOCK_ENGLISH_ENTRY, MOCK_DUTCH_ENTRY], FR);

    expect(result).toEqual({
      body: mockResolvedArticleBody(MOCK_ENGLISH_TEXT, MOCK_ENGLISH_ALT),
    });
  });

  it('resolves to nothing when neither language has a body', async () => {
    const result = await resolve([MOCK_DUTCH_ENTRY], FR);

    expect(result).toEqual({ body: null });
  });

  it('infers the projected article items', () => {
    type TResult = NonNullable<ReturnType<typeof query.parse>>;

    expectTypeOf<TResult['body']>().toEqualTypeOf<
      TMaybeNull<InferFragmentType<typeof portableTextBodyItemFragment>[]>
    >();
  });

  it('accepts only localized article-text fields as the field name', () => {
    expectTypeOf<
      TLocalizedKey<Module_content, InternationalizedArrayArticleText>
    >().toEqualTypeOf<'body'>();
  });
});
