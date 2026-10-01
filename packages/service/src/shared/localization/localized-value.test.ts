import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

import { buildLocalizedValueExpression } from './localized-value';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const document = {
  heading: [
    { _key: 'a', language: EN, value: 'Hello' },
    { _key: 'b', language: NL, value: 'Hallo' },
  ],
};

function resolve(root: unknown, locale: string): Promise<unknown> {
  return evaluateGroqExpression(
    buildLocalizedValueExpression('heading'),
    [],
    root,
    { locale, defaultLocale: EN },
  );
}

describe(buildLocalizedValueExpression, () => {
  it('resolves the value in the requested language', async () => {
    expect(await resolve(document, NL)).toBe('Hallo');
  });

  it('falls back to the default language when the requested one is missing', async () => {
    expect(await resolve(document, FR)).toBe('Hello');
  });

  it('resolves to nothing when neither language has a value', async () => {
    expect(
      await resolve(
        { heading: [{ _key: 'b', language: NL, value: 'Hallo' }] },
        FR,
      ),
    ).toBeNull();
  });
});
