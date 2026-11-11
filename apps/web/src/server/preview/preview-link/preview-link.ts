import { createHmac } from 'node:crypto';

import type { TMaybeUndefined } from '@blog/config';
import { isSecretMatch } from '@blog/utils';
import { PAYLOAD_ENCODING } from '@blog/utils/encryption';
import { SHA256_ALGORITHM } from '@blog/utils/hash';
import { hasLength } from '@blog/utils/primitives';
import {
  PREVIEW_LINK_REFUSAL,
  type TPreviewLinkRefusal,
} from '@web/constants/preview';
import { toInSitePathname } from '@web/utils/to-in-site-pathname';
import { z } from 'zod';

const TOKEN_SEPARATOR = '.';

const previewLinkPayloadSchema = z.object({
  tenantId: z.string().min(1),
  path: z.string().min(1),
  exp: z.number().int(),
});

type TPreviewLinkPayload = z.infer<typeof previewLinkPayloadSchema>;

type TPreviewLinkCheck =
  | { isValid: true; path: string }
  | { isValid: false; refusal: TPreviewLinkRefusal };

type TVerifyPreviewLinkParams = {
  token: TMaybeUndefined<string>;
  secret: string;
  tenantId: string;
  now?: number;
};

const signEncodedPayload = (encodedPayload: string, secret: string): string =>
  createHmac(SHA256_ALGORITHM, secret)
    .update(encodedPayload)
    .digest(PAYLOAD_ENCODING);

/** `exp` is in epoch milliseconds. */
export const signPreviewLinkToken = (
  payload: TPreviewLinkPayload,
  secret: string,
): string => {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    PAYLOAD_ENCODING,
  );
  return `${encodedPayload}${TOKEN_SEPARATOR}${signEncodedPayload(encodedPayload, secret)}`;
};

const decodePayload = (
  encodedPayload: string,
): TMaybeUndefined<TPreviewLinkPayload> => {
  try {
    const json: unknown = JSON.parse(
      Buffer.from(encodedPayload, PAYLOAD_ENCODING).toString(),
    );
    const parsed = previewLinkPayloadSchema.safeParse(json);
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
};

const readSignedPayload = (
  token: TMaybeUndefined<string>,
  secret: string,
): TMaybeUndefined<TPreviewLinkPayload> => {
  const [encodedPayload, signature, ...extra] =
    token?.split(TOKEN_SEPARATOR) ?? [];
  const isSigned =
    encodedPayload &&
    signature &&
    !hasLength(extra) &&
    isSecretMatch(signature, signEncodedPayload(encodedPayload, secret));

  return isSigned ? decodePayload(encodedPayload) : undefined;
};

const refuse = (refusal: TPreviewLinkRefusal): TPreviewLinkCheck => ({
  isValid: false,
  refusal,
});

export const verifyPreviewLink = ({
  token,
  secret,
  tenantId,
  now = Date.now(),
}: TVerifyPreviewLinkParams): TPreviewLinkCheck => {
  const payload = readSignedPayload(token, secret);
  if (!payload) return refuse(PREVIEW_LINK_REFUSAL.MALFORMED);
  if (payload.exp <= now) return refuse(PREVIEW_LINK_REFUSAL.EXPIRED);
  if (payload.tenantId !== tenantId) {
    return refuse(PREVIEW_LINK_REFUSAL.OTHER_TENANT);
  }

  const path = toInSitePathname(payload.path);
  return path
    ? { isValid: true, path }
    : refuse(PREVIEW_LINK_REFUSAL.OUTSIDE_SITE);
};
