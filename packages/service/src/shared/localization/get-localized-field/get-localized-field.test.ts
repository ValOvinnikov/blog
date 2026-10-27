import type {
  TMaybeNull,
  InternationalizedArrayReference,
  InternationalizedArrayString,
  Module_cta,
} from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { q } from '@blog/service/sanity/query/query';
import type { TLocaleQueryParams } from '@blog/service/shared/localization/locale-query-params/locale-query-params';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  MOCK_DUTCH_TEXT,
  MOCK_ENGLISH_TEXT,
  mockLocalizedStrings,
} from '@blog/service/testing/shared/localized';
import { faker } from '@faker-js/faker';

import { getLocalizedField, type TLocalizedKey } from './get-localized-field';

faker.seed(6016);

const { EN, NL, FR } = LOCALE_ISO_CODES;
const MOCK_LINK_ID = faker.string.uuid();

const query = q
  .parameters<TLocaleQueryParams>()
  .star.filterByType('link')
  .slice(0)
  .project((sub) => ({
    label: getLocalizedField(sub, 'label'),
  }));

const MOCK_LABEL = mockLocalizedStrings({
  [EN]: MOCK_ENGLISH_TEXT,
  [NL]: MOCK_DUTCH_TEXT,
});

function resolve(label: unknown[], locale: string): Promise<unknown> {
  return evaluateGroqExpression(
    query.query,
    [{ _id: MOCK_LINK_ID, _type: 'link', label }],
    undefined,
    {
      locale,
      defaultLocale: EN,
    },
  );
}

const typedQuery = q
  .parameters<TLocaleQueryParams>()
  .star.filterByType('module_cta')
  .slice(0)
  .project((sub) => ({
    eyebrow: getLocalizedField(sub, 'eyebrow'),
  }));

describe(getLocalizedField, () => {
  it('resolves the value in the requested language', async () => {
    const result = await resolve(MOCK_LABEL, NL);

    expect(result).toEqual({ label: MOCK_DUTCH_TEXT });
  });

  it('falls back to the default language when the requested one is missing', async () => {
    const result = await resolve(MOCK_LABEL, FR);

    expect(result).toEqual({ label: MOCK_ENGLISH_TEXT });
  });

  it('resolves to nothing when neither language has a value', async () => {
    const result = await resolve(
      mockLocalizedStrings({ [NL]: MOCK_DUTCH_TEXT }),
      FR,
    );

    expect(result).toEqual({ label: null });
  });

  it('infers a string for a plain field', () => {
    expectTypeOf(typedQuery.parse).returns.toEqualTypeOf<
      TMaybeNull<{ eyebrow: TMaybeNull<string> }>
    >();
  });

  it('accepts only string-valued localized fields as the field name', () => {
    expectTypeOf<TLocalizedKey<Module_cta>>().toEqualTypeOf<
      'eyebrow' | 'footnote'
    >();
  });

  it('rejects an internationalized array that is not string-valued', () => {
    type TScope = {
      label: InternationalizedArrayString;
      target: InternationalizedArrayReference;
    };

    expectTypeOf<TLocalizedKey<TScope>>().toEqualTypeOf<'label'>();
  });
});
