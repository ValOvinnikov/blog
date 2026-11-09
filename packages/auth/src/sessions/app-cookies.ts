import { AUTH_APP, type TAuthApp } from '@blog/config/constants';
import type { NextAuthConfig } from 'next-auth';

type TAppCookies = Record<
  keyof Required<NonNullable<NextAuthConfig['cookies']>>,
  { name: string }
>;

// The site's names are Auth.js's defaults; renaming either app's signs its users out.
const APP_COOKIE_NAMESPACE: Record<TAuthApp, string> = {
  [AUTH_APP.SITE]: 'authjs.',
  [AUTH_APP.PLATFORM]: 'authjs.platform.',
};

export function buildAppCookies(
  app: TAuthApp,
  useSecureCookies: boolean,
): TAppCookies {
  const prefix = useSecureCookies ? '__Secure-' : '';
  const hostPrefix = useSecureCookies ? '__Host-' : '';
  const namespace = APP_COOKIE_NAMESPACE[app];

  return {
    sessionToken: { name: `${prefix}${namespace}session-token` },
    callbackUrl: { name: `${prefix}${namespace}callback-url` },
    csrfToken: { name: `${hostPrefix}${namespace}csrf-token` },
    pkceCodeVerifier: { name: `${prefix}${namespace}pkce.code_verifier` },
    state: { name: `${prefix}${namespace}state` },
    nonce: { name: `${prefix}${namespace}nonce` },
    webauthnChallenge: { name: `${prefix}${namespace}challenge` },
  };
}
