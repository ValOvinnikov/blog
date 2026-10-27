import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { mockTenant } from '@blog/service/testing/tenant';

import { buildLocaleQueryParams } from './locale-query-params';

const { EN, NL } = LOCALE_ISO_CODES;
const MOCK_TENANT = mockTenant();

describe(buildLocaleQueryParams, () => {
  it('passes the requested and default languages through', () => {
    const params = buildLocaleQueryParams({
      ...MOCK_TENANT,
      locale: NL,
      defaultLocale: EN,
    });

    expect(params).toEqual({ locale: NL, defaultLocale: EN });
  });

  it('requests the default language when no locale is given', () => {
    const params = buildLocaleQueryParams({
      ...MOCK_TENANT,
      defaultLocale: NL,
    });

    expect(params).toEqual({ locale: NL, defaultLocale: NL });
  });
});
