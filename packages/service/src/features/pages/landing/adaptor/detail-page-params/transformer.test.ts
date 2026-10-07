import { LOCALE_ISO_CODES } from '@blog/config/constants';

import { toLandingPageParams } from './transformer';

const { EN, NL } = LOCALE_ISO_CODES;

describe(toLandingPageParams, () => {
  it('keeps the pages whose path resolved and drops the rest', () => {
    expect(
      toLandingPageParams([
        { slug: 'modules', language: EN },
        { slug: null, language: EN },
        { slug: 'modules/faq', language: NL },
      ]),
    ).toEqual([
      { slug: 'modules', language: EN },
      { slug: 'modules/faq', language: NL },
    ]);
  });
});
