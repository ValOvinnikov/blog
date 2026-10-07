import { LOCALE_ISO_CODES } from '@blog/config/constants';

import { buildLocaleQueryParams } from './locale-query-params';

const { EN, NL } = LOCALE_ISO_CODES;
const tenant = { projectId: 'p', dataset: 'production', token: 't' };

describe(buildLocaleQueryParams, () => {
  it('passes the requested and default languages through', () => {
    expect(
      buildLocaleQueryParams({ ...tenant, locale: NL, defaultLocale: EN }),
    ).toEqual({ locale: NL, defaultLocale: EN });
  });

  it('requests the default language when no locale is given', () => {
    expect(buildLocaleQueryParams({ ...tenant, defaultLocale: NL })).toEqual({
      locale: NL,
      defaultLocale: NL,
    });
  });
});
