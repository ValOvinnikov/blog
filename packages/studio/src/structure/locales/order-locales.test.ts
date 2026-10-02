import { LOCALE_ISO_CODES } from '@blog/config/constants';

import { orderLocales } from './order-locales';

describe('orderLocales', () => {
  it('puts the default locale first and keeps the rest in order', () => {
    expect(
      orderLocales(LOCALE_ISO_CODES.NL, [
        LOCALE_ISO_CODES.EN,
        LOCALE_ISO_CODES.NL,
        LOCALE_ISO_CODES.FR,
      ]),
    ).toEqual([LOCALE_ISO_CODES.NL, LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.FR]);
  });

  it('includes the default locale even when it is not live', () => {
    expect(orderLocales(LOCALE_ISO_CODES.EN, [LOCALE_ISO_CODES.FR])).toEqual([
      LOCALE_ISO_CODES.EN,
      LOCALE_ISO_CODES.FR,
    ]);
  });

  it('offers every locale when none are given', () => {
    expect(orderLocales(LOCALE_ISO_CODES.DE)).toEqual([
      LOCALE_ISO_CODES.DE,
      LOCALE_ISO_CODES.EN,
      LOCALE_ISO_CODES.NL,
      LOCALE_ISO_CODES.FR,
      LOCALE_ISO_CODES.ES,
    ]);
  });
});
