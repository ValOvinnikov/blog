import { LOCALE_ISO_CODES } from '@blog/config';
import type { TCookieStatementPage } from '@blog/service';
import { MOCK_CONTENTS_RAIL_BODY } from '@web/testing/shared/contents-rail/fixtures';
import { mockSeo } from '@web/testing/shared/seo/fixtures';

export const mockCookieStatementPage = (
  overrides: Partial<TCookieStatementPage> = {},
): TCookieStatementPage => {
  return {
    id: 'cookie-statement-en',
    title: 'Cookie statement',
    body: MOCK_CONTENTS_RAIL_BODY,
    seo: mockSeo(),
    translations: [LOCALE_ISO_CODES.EN],
    ...overrides,
  };
};
