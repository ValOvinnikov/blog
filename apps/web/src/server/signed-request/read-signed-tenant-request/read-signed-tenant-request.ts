import type { TMaybeUndefined } from '@blog/config';
import { HTTP_STATUS, type THttpStatus } from '@blog/config/constants';
import { queries } from '@blog/db';
import type { TTenantSanityCredentials } from '@blog/db/queries/tenants/get-tenant-sanity-credentials/get-tenant-sanity-credentials';
import { isUndefined } from '@blog/utils/primitives';
import { readSignedRequestBody } from '@web/server/signed-request/read-signed-request-body/read-signed-request-body';
import { respondEmpty } from '@web/utils/empty-response/empty-response';
import { logger } from '@web/utils/logger/logger';
import type { NextResponse } from 'next/server';
import type { z } from 'zod';

export type TSignedTenantRequest<TBody> =
  { refusal: NextResponse } | { body: TBody; tenant: TTenantSanityCredentials };

export type TSignedTenantRequestOptions = {
  secret: TMaybeUndefined<string>;
  log: { SECRET_MISSING: string; TENANT_LOOKUP_FAILED: string };
};

const refuse = (status: THttpStatus) => ({ refusal: respondEmpty(status) });

const parseBody = <TBody>(rawBody: string, schema: z.ZodType<TBody>) => {
  try {
    return schema.safeParse(JSON.parse(rawBody));
  } catch {
    return undefined;
  }
};

export const readSignedTenantRequest = async <
  TBody extends { tenantId: string },
>(
  request: Request,
  bodySchema: z.ZodType<TBody>,
  { secret, log }: TSignedTenantRequestOptions,
): Promise<TSignedTenantRequest<TBody>> => {
  if (!secret) {
    logger.error(log.SECRET_MISSING);
    return refuse(HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  const rawBody = await readSignedRequestBody(request, secret);
  if (isUndefined(rawBody)) {
    return refuse(HTTP_STATUS.UNAUTHORIZED);
  }

  const parsedBody = parseBody(rawBody, bodySchema);
  if (!parsedBody?.success) {
    return refuse(HTTP_STATUS.BAD_REQUEST);
  }
  const body = parsedBody.data;

  let tenant;
  try {
    tenant = await queries.tenants.getTenantSanityCredentials(body.tenantId);
  } catch (error) {
    logger.error(log.TENANT_LOOKUP_FAILED, {
      tenantId: body.tenantId,
      error,
    });
    return refuse(HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
  if (!tenant) {
    return refuse(HTTP_STATUS.NOT_FOUND);
  }

  return { body, tenant };
};
