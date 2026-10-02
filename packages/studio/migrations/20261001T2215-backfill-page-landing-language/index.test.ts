import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { at, setIfMissing } from 'sanity/migrate';

import { backfillPageLandingLanguage } from './index';

describe(backfillPageLandingLanguage, () => {
  it('sets English on a page with no language', () => {
    expect(backfillPageLandingLanguage({})).toEqual([
      at('language', setIfMissing(LOCALE_ISO_CODES.EN)),
    ]);
  });

  it('leaves a page that already has a language alone', () => {
    expect(
      backfillPageLandingLanguage({ language: LOCALE_ISO_CODES.NL }),
    ).toBeUndefined();
  });
});
