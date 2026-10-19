import type { NextAuthConfig } from 'next-auth';

export function buildPlatformCookies(
  useSecureCookies: boolean,
): NonNullable<NextAuthConfig['cookies']> {
  const prefix = useSecureCookies ? '__Secure-' : '';
  const hostPrefix = useSecureCookies ? '__Host-' : '';

  return {
    sessionToken: { name: `${prefix}authjs.platform.session-token` },
    callbackUrl: { name: `${prefix}authjs.platform.callback-url` },
    csrfToken: { name: `${hostPrefix}authjs.platform.csrf-token` },
    pkceCodeVerifier: { name: `${prefix}authjs.platform.pkce.code_verifier` },
    state: { name: `${prefix}authjs.platform.state` },
    nonce: { name: `${prefix}authjs.platform.nonce` },
    webauthnChallenge: { name: `${prefix}authjs.platform.challenge` },
  };
}
