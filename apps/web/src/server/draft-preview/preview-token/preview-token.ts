import { createHmac } from 'node:crypto';

import type { TMaybeUndefined } from '@blog/config';
import { isSecretMatch } from '@blog/utils';
import { PAYLOAD_ENCODING } from '@blog/utils/encryption';
import { SHA256_ALGORITHM } from '@blog/utils/hash';
import { hasLength } from '@blog/utils/primitives';
import { env } from '@web/utils/env/env';
import { z } from 'zod';

const previewTokenClaimsSchema = z.object({
  tenantId: z.string().min(1),
  path: z.string().min(1),
  expiresAt: z.number().int(),
});

export type TPreviewTokenClaims = z.infer<typeof previewTokenClaimsSchema>;

const TOKEN_SEPARATOR = '.';
const PAYLOAD_TEXT_ENCODING = 'utf8';

const signPayload = (payload: string, secret: string): string =>
  createHmac(SHA256_ALGORITHM, secret).update(payload).digest(PAYLOAD_ENCODING);

const parseClaims = (payload: string): unknown => {
  try {
    return JSON.parse(
      Buffer.from(payload, PAYLOAD_ENCODING).toString(PAYLOAD_TEXT_ENCODING),
    );
  } catch {
    return undefined;
  }
};

export const mintPreviewToken = (claims: TPreviewTokenClaims): string => {
  const secret = env.PREVIEW_LINK_SECRET;
  if (!secret) throw new Error('PREVIEW_LINK_SECRET is not set.');

  const payload = Buffer.from(JSON.stringify(claims)).toString(
    PAYLOAD_ENCODING,
  );
  return `${payload}${TOKEN_SEPARATOR}${signPayload(payload, secret)}`;
};

export const readPreviewTokenClaims = (
  token: string,
  now: number = Date.now(),
): TMaybeUndefined<TPreviewTokenClaims> => {
  const secret = env.PREVIEW_LINK_SECRET;
  const [payload, signature, ...rest] = token.split(TOKEN_SEPARATOR);
  if (!secret || !payload || !signature || hasLength(rest)) return undefined;
  if (!isSecretMatch(signature, signPayload(payload, secret))) return undefined;

  const parsed = previewTokenClaimsSchema.safeParse(parseClaims(payload));
  return parsed.success && parsed.data.expiresAt > now
    ? parsed.data
    : undefined;
};
