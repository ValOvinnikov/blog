import type {
  InternationalizedArrayArticleText,
  Module_content,
} from '@blog/config';
import { ASIDE_KIND, LOCALE_ISO_CODES } from '@blog/config/constants';
import { q } from '@blog/service/sanity/query/query';
import type { portableTextBodyItemFragment } from '@blog/service/shared/fragments/portable-text/portable-text-body-item';
import type { TLocalizedKey } from '@blog/service/shared/localization/get-localized-field/get-localized-field';
import type { TLocaleQueryParams } from '@blog/service/shared/localization/locale-query-params/locale-query-params';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { paragraphBlocks } from '@blog/service/testing/shared/localized';
import type { InferFragmentType } from 'groqd';

import { getLocalizedArticleText } from './get-localized-article-text';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const query = q
  .parameters<TLocaleQueryParams>()
  .star.filterByType('module_content')
  .slice(0)
  .project((sub) => ({
    body: getLocalizedArticleText(sub, 'body'),
  }));

function resolve(body: unknown[], locale: string) {
  return evaluateGroqExpression(
    query.query,
    [{ _id: 'content-1', _type: 'module_content', body }],
    undefined,
    { locale, defaultLocale: EN },
  );
}

function article(text: string, alt: string) {
  return [
    ...paragraphBlocks(text),
    {
      _type: 'bodyImage',
      _key: 'image-1',
      alt,
      layout: 'FULL_BLEED',
    },
    {
      _type: 'aside',
      _key: 'aside-1',
      kind: ASIDE_KIND.CONTEXT,
      body: paragraphBlocks(`${text} Aside.`),
    },
  ];
}

const english = {
  _key: EN,
  language: EN,
  value: article('Read on.', 'A diagram'),
};
const dutch = {
  _key: NL,
  language: NL,
  value: article('Lees verder.', 'Een diagram'),
};

describe(getLocalizedArticleText, () => {
  it('resolves the text, images and asides in the requested language', async () => {
    expect(await resolve([english, dutch], NL)).toMatchObject({
      body: [
        { _type: 'block', children: [{ text: 'Lees verder.' }] },
        { _type: 'bodyImage', alt: 'Een diagram', layout: 'FULL_BLEED' },
        {
          _type: 'aside',
          body: [{ children: [{ text: 'Lees verder. Aside.' }] }],
        },
      ],
    });
  });

  it('falls back to the default language when the requested one is missing', async () => {
    expect(await resolve([english, dutch], FR)).toMatchObject({
      body: [
        { _type: 'block', children: [{ text: 'Read on.' }] },
        { _type: 'bodyImage', alt: 'A diagram' },
        { _type: 'aside', body: [{ children: [{ text: 'Read on. Aside.' }] }] },
      ],
    });
  });

  it('resolves to nothing when neither language has a body', async () => {
    expect(await resolve([dutch], FR)).toEqual({ body: null });
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
