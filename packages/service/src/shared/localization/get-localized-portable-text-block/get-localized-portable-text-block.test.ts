import type {
  InternationalizedArrayListedText,
  Module_cta,
} from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { q } from '@blog/service/sanity/query/query';
import type { textBlockFragment } from '@blog/service/shared/fragments/portable-text/text-block';
import type { TLocalizedKey } from '@blog/service/shared/localization/get-localized-field/get-localized-field';
import type { TLocaleParams } from '@blog/service/shared/localization/locale-params/locale-params';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { paragraphBlocks } from '@blog/service/testing/shared/localized';
import type { InferFragmentType } from 'groqd';

import { getLocalizedPortableTextBlock } from './get-localized-portable-text-block';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const query = q
  .parameters<TLocaleParams>()
  .star.filterByType('module_cta')
  .slice(0)
  .project((sub) => ({
    content: getLocalizedPortableTextBlock(sub, 'content'),
  }));

function resolve(content: unknown[], locale: string) {
  return evaluateGroqExpression(
    query.query,
    [{ _id: 'cta-1', _type: 'module_cta', content }],
    undefined,
    { locale, defaultLocale: EN },
  );
}

const english = { _key: EN, language: EN, value: paragraphBlocks('Read on.') };
const dutch = {
  _key: NL,
  language: NL,
  value: paragraphBlocks('Lees verder.'),
};

describe(getLocalizedPortableTextBlock, () => {
  it('resolves the blocks in the requested language', async () => {
    expect(await resolve([english, dutch], NL)).toMatchObject({
      content: [{ children: [{ text: 'Lees verder.' }] }],
    });
  });

  it('falls back to the default language when the requested one is missing', async () => {
    expect(await resolve([english, dutch], FR)).toMatchObject({
      content: [{ children: [{ text: 'Read on.' }] }],
    });
  });

  it('resolves to nothing when neither language has blocks', async () => {
    expect(await resolve([dutch], FR)).toEqual({ content: null });
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
