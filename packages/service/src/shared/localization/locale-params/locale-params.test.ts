import { LOCALE_ISO_CODES } from '@blog/config/constants';

import { buildLocaleParams } from './locale-params';

const { EN, NL } = LOCALE_ISO_CODES;
const tenant = { projectId: 'p', dataset: 'production', token: 't' };

describe(buildLocaleParams, () => {
  it('passes the requested and default languages through', () => {
    expect(
      buildLocaleParams({ ...tenant, locale: NL, defaultLocale: EN }),
    ).toEqual({ locale: NL, defaultLocale: EN });
  });

  it('requests the default language when no locale is given', () => {
    expect(buildLocaleParams({ ...tenant, defaultLocale: NL })).toEqual({
      locale: NL,
      defaultLocale: NL,
    });
  });
});
