import { getCookieStatementPage } from '@blog/service/features/pages/cookie-statement/adaptor/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query/query';
import { safeAsync } from '@blog/utils';

export function createCookieStatementService() {
  return {
    v1: {
      getCookieStatementPage: safeAsync((tenant: TTenantSanityContext) =>
        getCookieStatementPage(tenant),
      ),
    },
  };
}
