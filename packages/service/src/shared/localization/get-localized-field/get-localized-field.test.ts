import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { q } from '@blog/service/sanity/query';
import type { TLocaleParams } from '@blog/service/shared/localization/locale-params/locale-params';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

import { getLocalizedField } from './get-localized-field';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const query = q
  .parameters<TLocaleParams>()
  .star.filterByType('link')
  .slice(0)
  .project((sub) => ({
    label: getLocalizedField(sub, (filter) =>
      sub.field('label[]').filterBy(filter).slice(0).field('value'),
    ),
  }));

const document = {
  label: [
    { _key: 'a', language: EN, value: 'Hello' },
    { _key: 'b', language: NL, value: 'Hallo' },
  ],
};

function resolve(root: unknown, locale: string): Promise<unknown> {
  return evaluateGroqExpression(
    query.query,
    [{ _id: 'link-1', _type: 'link', ...(root as object) }],
    undefined,
    {
      locale,
      defaultLocale: EN,
    },
  );
}

describe(getLocalizedField, () => {
  it('resolves the value in the requested language', async () => {
    expect(await resolve(document, NL)).toEqual({ label: 'Hallo' });
  });

  it('falls back to the default language when the requested one is missing', async () => {
    expect(await resolve(document, FR)).toEqual({ label: 'Hello' });
  });

  it('resolves to nothing when neither language has a value', async () => {
    expect(
      await resolve(
        { label: [{ _key: 'b', language: NL, value: 'Hallo' }] },
        FR,
      ),
    ).toEqual({ label: null });
  });
});
