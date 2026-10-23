import type {
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

const english = mockLocalizedEntry(EN, mockParagraphBlocks(MOCK_ENGLISH_TEXT));
const dutch = mockLocalizedEntry(NL, mockParagraphBlocks(MOCK_DUTCH_TEXT));

describe(getLocalizedPortableTextBlock, () => {
  it('resolves the blocks in the requested language', async () => {
    const result = await resolve([english, dutch], NL);

    expect(result).toMatchObject({
      content: [{ children: [{ text: MOCK_DUTCH_TEXT }] }],
    });
  });

  it('falls back to the default language when the requested one is missing', async () => {
    const result = await resolve([english, dutch], FR);

    expect(result).toMatchObject({
      content: [{ children: [{ text: MOCK_ENGLISH_TEXT }] }],
    });
  });

  it('resolves to nothing when neither language has blocks', async () => {
    const result = await resolve([dutch], FR);

    expect(result).toEqual({ content: null });
  });
});

describe('getLocalizedPortableTextBlock types', () => {
  it('infers the generic projected text blocks', () => {
    type TResult = NonNullable<ReturnType<typeof query.parse>>;

    expectTypeOf<TResult['content']>().toEqualTypeOf<
      InferFragmentType<typeof textBlockFragment>[] | null
    >();
  });

  it('accepts only block-array localized fields as the field name', () => {
    expectTypeOf<
      TLocalizedKey<Module_cta, InternationalizedArrayListedText>
    >().toEqualTypeOf<'content'>();
  });
});
