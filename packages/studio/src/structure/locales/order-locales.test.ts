import { LOCALE_ISO_CODES, type TLocaleIsoCode } from '@blog/config/constants';
import type { TMaybeUndefined } from '@blog/config/types';

import { orderLocales } from './order-locales';

const { EN, NL, FR, ES, DE } = LOCALE_ISO_CODES;

describe(orderLocales, () => {
  it.each<{
    case: string;
    defaultLocale: TLocaleIsoCode;
    liveLocales: TMaybeUndefined<TLocaleIsoCode[]>;
    expected: TLocaleIsoCode[];
  }>([
    {
      case: 'puts the default locale first and keeps the rest in order',
      defaultLocale: NL,
      liveLocales: [EN, NL, FR],
      expected: [NL, EN, FR],
    },
    {
      case: 'includes the default locale even when it is not live',
      defaultLocale: EN,
      liveLocales: [FR],
      expected: [EN, FR],
    },
    {
      case: 'offers every locale when none are given',
      defaultLocale: DE,
      liveLocales: undefined,
      expected: [DE, EN, NL, FR, ES],
    },
  ])('$case', ({ defaultLocale, liveLocales, expected }) => {
    expect(orderLocales(defaultLocale, liveLocales)).toEqual(expected);
  });
});
