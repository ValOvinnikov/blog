import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { at, setIfMissing } from 'sanity/migrate';

import { backfillLanguage } from './backfill-language';

describe(backfillLanguage, () => {
  it('sets English on a document with no language', () => {
    expect(backfillLanguage({})).toEqual([
      at('language', setIfMissing(LOCALE_ISO_CODES.EN)),
    ]);
  });

  it('leaves a document that already has a language alone', () => {
    expect(backfillLanguage({ language: LOCALE_ISO_CODES.NL })).toBeUndefined();
  });
});
