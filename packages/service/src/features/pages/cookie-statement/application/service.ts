import { getCookieStatementPage } from '@shinefold/service/features/pages/cookie-statement/adaptor/loader';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';
import { safeAsync } from '@shinefold/utils';

export function createCookieStatementService() {
  return {
    v1: {
      getCookieStatementPage: safeAsync((tenant: TTenantSanityContext) =>
        getCookieStatementPage(tenant),
      ),
    },
  };
}
