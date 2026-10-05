import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { at, set } from 'sanity/migrate';

import { localizeHeroProfileEyebrow } from './index';

const { EN } = LOCALE_ISO_CODES;

const strings = (value: string) => [
  { _key: EN, _type: 'internationalizedArrayStringValue', language: EN, value },
];

describe(localizeHeroProfileEyebrow, () => {
  it('moves the eyebrow into the default language', () => {
    expect(localizeHeroProfileEyebrow({ eyebrow: 'Founder' })).toEqual([
      at('eyebrow', set(strings('Founder'))),
    ]);
  });

  it('is idempotent — an already localized eyebrow is left alone', () => {
    expect(
      localizeHeroProfileEyebrow({ eyebrow: strings('Founder') }),
    ).toBeUndefined();
  });

  it('leaves a hero without an eyebrow alone', () => {
    expect(localizeHeroProfileEyebrow({})).toBeUndefined();
  });
});
