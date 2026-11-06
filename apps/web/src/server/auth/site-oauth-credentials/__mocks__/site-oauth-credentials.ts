import type * as TModule from '@web/server/auth/site-oauth-credentials/site-oauth-credentials';

export const getSiteOAuthCredentials = vi.fn<
  typeof TModule.getSiteOAuthCredentials
>(async () => ({}));

export const getRequestSiteOAuthCredentials = vi.fn<
  typeof TModule.getRequestSiteOAuthCredentials
>(async () => ({}));
