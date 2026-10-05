import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { localizedStrings } from '@blog/service/testing/shared/localized';

import { siteSettingsQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const siteSettingsDocument = {
  _id: 'settings_site',
  _type: 'settings_site',
  brand: {
    _type: 'brand',
    name: 'Awesome Blog',
    tagline: {
      _type: 'brandTagline',
      items: [
        {
          _key: 'item-1',
          _type: 'brandTaglineItem',
          text: localizedStrings({ [EN]: 'online', [NL]: 'actief' }),
        },
        {
          _key: 'item-2',
          _type: 'brandTaglineItem',
          text: localizedStrings({ [EN]: 'build 2026.07' }),
        },
      ],
      separator: 'DOT',
    },
  },
  currency: 'USD',
};

async function runSiteSettings(locale: string) {
  const raw = await evaluateGroqExpression(
    siteSettingsQuery.query,
    [siteSettingsDocument],
    undefined,
    { locale, defaultLocale: EN },
  );

  return siteSettingsQuery.parse(raw);
}

describe('siteSettingsQuery', () => {
  it('picks each tagline item in the visitor language', async () => {
    const settings = await runSiteSettings(NL);

    expect(settings.brand.tagline?.items).toEqual([
      { _key: 'item-1', text: 'actief' },
      { _key: 'item-2', text: 'build 2026.07' },
    ]);
  });

  it('falls back to the default language for tagline items', async () => {
    const settings = await runSiteSettings(FR);

    expect(settings.brand.tagline?.items).toEqual([
      { _key: 'item-1', text: 'online' },
      { _key: 'item-2', text: 'build 2026.07' },
    ]);
  });
});
