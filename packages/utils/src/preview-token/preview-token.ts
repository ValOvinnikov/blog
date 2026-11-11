import { createHmac } from 'node:crypto';

import { isSecretMatch } from '@blog/utils';
import { PAYLOAD_ENCODING } from '@blog/utils/encryption';
import { SHA256_ALGORITHM } from '@blog/utils/hash';
import { hasLength, isString } from '@blog/utils/primitives';

export interface IPreviewTokenClaims {
  tenantId: string;
  path: string;
  expiresAt: number;
}

export const PREVIEW_TOKEN_MAX_AGE_MS = 60 * 60_000;
export const PREVIEW_TOKEN_CLOCK_SKEW_MS = 60_000;

const TOKEN_SEPARATOR = '.';
const PAYLOAD_TEXT_ENCODING = 'utf8';

function signPayload(payload: string, secret: string): string {
  return createHmac(SHA256_ALGORITHM, secret)
    .update(payload)
    .digest(PAYLOAD_ENCODING);
}

function isPreviewTokenClaims(value: unknown): value is IPreviewTokenClaims {
  if (typeof value !== 'object' || value === null) return false;
  const { tenantId, path, expiresAt } = value as Record<string, unknown>;
  return (
    isString(tenantId) &&
    hasLength(tenantId) &&
    isString(path) &&
    hasLength(path) &&
    Number.isSafeInteger(expiresAt)
  );
}

function parseClaims(payload: string): IPreviewTokenClaims | undefined {
  try {
    const value: unknown = JSON.parse(
      Buffer.from(payload, PAYLOAD_ENCODING).toString(PAYLOAD_TEXT_ENCODING),
    );
    return isPreviewTokenClaims(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

export function signPreviewToken(
  claims: IPreviewTokenClaims,
  secret: string,
): string {
  const payload = Buffer.from(JSON.stringify(claims)).toString(
    PAYLOAD_ENCODING,
  );
  return `${payload}${TOKEN_SEPARATOR}${signPayload(payload, secret)}`;
}

/** A token is accepted only before it expires and only if its expiry is no further ahead than the maximum lifetime. */
export function readPreviewTokenClaims(
  token: string,
  secret: string,
  now: number = Date.now(),
): IPreviewTokenClaims | undefined {
  const [payload, signature, ...rest] = token.split(TOKEN_SEPARATOR);
  if (!payload || !signature || hasLength(rest)) return undefined;
  if (!isSecretMatch(signature, signPayload(payload, secret))) return undefined;

  const claims = parseClaims(payload);
  if (!claims) return undefined;

  const remainingMs = claims.expiresAt - now;
  const isLive =
    remainingMs > 0 &&
    remainingMs <= PREVIEW_TOKEN_MAX_AGE_MS + PREVIEW_TOKEN_CLOCK_SKEW_MS;
  return isLive ? claims : undefined;
}
