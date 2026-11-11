import {
  readInternalPageRequest,
  type TTenantSanityCredentials,
} from '@web/server/internal-pages/read-internal-page-request/read-internal-page-request';
import type { NextResponse } from 'next/server';
import type { z } from 'zod';

export type TInternalPageRouteContext = { params: Promise<{ id: string }> };

type TInternalPage<TBody> = {
  id: string;
  body: TBody;
  tenant: TTenantSanityCredentials;
};

export const respondToInternalPageRequest = async <
  TBody extends { tenantId: string },
>(
  request: Request,
  { params }: TInternalPageRouteContext,
  bodySchema: z.ZodType<TBody>,
  respond: (page: TInternalPage<TBody>) => Promise<NextResponse>,
): Promise<NextResponse> => {
  const internalRequest = await readInternalPageRequest(request, bodySchema);
  if ('refusal' in internalRequest) {
    return internalRequest.refusal;
  }
  const { id } = await params;

  return respond({ id, ...internalRequest });
};
