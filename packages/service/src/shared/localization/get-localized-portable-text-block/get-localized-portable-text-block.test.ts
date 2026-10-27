import type {
  TMaybeNull,
  InternationalizedArrayListedText,
  Module_cta,
} from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { q } from '@blog/service/sanity/query/query';
import type { textBlockFragment } from '@blog/service/shared/fragments/portable-text/text-block';
import type { TLocalizedKey } from '@blog/service/shared/localization/get-localized-field/get-localized-field';
import type { TLocaleQueryParams } from '@blog/service/shared/localization/locale-query-params/locale-query-params';
import { MOCK_CTA_MODULE_ID } from '@blog/service/testing/modules/fixtures';
import { createLocalizedFieldResolver } from '@blog/service/testing/shared/groq';
import {
  MOCK_DUTCH_TEXT,
  MOCK_ENGLISH_TEXT,
  mockLocalizedEntry,
  mockParagraphBlocks,
} from '@blog/service/testing/shared/localized';
import type { InferFragmentType } from 'groqd';

import { getLocalizedPortableTextBlock } from './get-localized-portable-text-block';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const query = q
  .parameters<TLocaleQueryParams>()
  .star.filterByType('module_cta')
  .slice(0)
  .project((sub) => ({
    content: getLocalizedPortableTextBlock(sub, 'content'),
  }));

const resolve = createLocalizedFieldResolver(query.query, (content) => ({
  _id: MOCK_CTA_MODULE_ID,
  _type: 'module_cta',
  content,
}));

const MOCK_ENGLISH_BLOCKS = mockParagraphBlocks(MOCK_ENGLISH_TEXT);
const MOCK_DUTCH_BLOCKS = mockParagraphBlocks(MOCK_DUTCH_TEXT);
const MOCK_ENGLISH_ENTRY = mockLocalizedEntry(EN, MOCK_ENGLISH_BLOCKS);
const MOCK_DUTCH_ENTRY = mockLocalizedEntry(NL, MOCK_DUTCH_BLOCKS);

describe(getLocalizedPortableTextBlock, () => {
  it('resolves the blocks in the requested language', async () => {
    const result = await resolve([MOCK_ENGLISH_ENTRY, MOCK_DUTCH_ENTRY], NL);

    expect(result).toEqual({ content: MOCK_DUTCH_BLOCKS });
  });

  it('falls back to the default language when the requested one is missing', async () => {
    const result = await resolve([MOCK_ENGLISH_ENTRY, MOCK_DUTCH_ENTRY], FR);

    expect(result).toEqual({ content: MOCK_ENGLISH_BLOCKS });
  });

  it('resolves to nothing when neither language has blocks', async () => {
    const result = await resolve([MOCK_DUTCH_ENTRY], FR);

    expect(result).toEqual({ content: null });
  });

  it('infers the generic projected text blocks', () => {
    type TResult = NonNullable<ReturnType<typeof query.parse>>;

    expectTypeOf<TResult['content']>().toEqualTypeOf<
      TMaybeNull<InferFragmentType<typeof textBlockFragment>[]>
    >();
  });

  it('accepts only block-array localized fields as the field name', () => {
    expectTypeOf<
      TLocalizedKey<Module_cta, InternationalizedArrayListedText>
    >().toEqualTypeOf<'content'>();
  });
});
