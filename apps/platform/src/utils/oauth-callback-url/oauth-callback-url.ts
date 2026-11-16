import { OAUTH_CALLBACK_PATH } from '@platform/constants/sign-in-apps';
import { tenantSiteUrl } from '@platform/utils/routes/routes';
import type { TOAuthProvider } from '@shinefold/config/constants';

export const oauthCallbackUrl = (domain: string, provider: TOAuthProvider) =>
  `${tenantSiteUrl(domain)}${OAUTH_CALLBACK_PATH}/${provider}`;
