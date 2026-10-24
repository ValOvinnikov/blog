import type { TMaybeNull, TMaybeUndefined } from '@blog/config';
import { queries } from '@blog/db';
import { errorResult, okResult, type TResult } from '@blog/utils';
import { decodeSignatureHeader, isValidSignature } from '@sanity/webhook';
import {
  REVALIDATE_SIGNATURE_MAX_AGE_MS,
  SIGNATURE_REFUSED_REASON,
} from '@web/constants/revalidate';

interface IRevalidateSignatureInput {
  rawBody: string;
  signature: TMaybeNull<string>;
  projectId: TMaybeNull<string>;
  sharedSecret: string;
  now: number;
}

const readSignatureTimestamp = (signature: string): TMaybeUndefined<number> => {
  try {
    return decodeSignatureHeader(signature).timestamp;
  } catch {
    return undefined;
  }
};

// Resolves the signing tenant's id; a tenant with no stored secret yet still signs with the shared one.
export const verifyRevalidateSignature = async ({
  rawBody,
  signature,
  projectId,
  sharedSecret,
  now,
}: IRevalidateSignatureInput): Promise<
  TResult<TMaybeUndefined<string>, typeof SIGNATURE_REFUSED_REASON>
> => {
  const timestamp = signature ? readSignatureTimestamp(signature) : undefined;
  if (
    !signature ||
    timestamp === undefined ||
    Math.abs(now - timestamp) > REVALIDATE_SIGNATURE_MAX_AGE_MS
  ) {
    return errorResult(SIGNATURE_REFUSED_REASON);
  }

  const tenant = projectId
    ? await queries.tenants.getTenantRevalidateWebhookSecret(projectId)
    : undefined;

  const valid = await isValidSignature(
    rawBody,
    signature,
    tenant?.secret ?? sharedSecret,
  );

  return valid
    ? okResult(tenant?.tenantId)
    : errorResult(SIGNATURE_REFUSED_REASON);
};
