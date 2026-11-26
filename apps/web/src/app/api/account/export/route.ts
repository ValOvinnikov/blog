import { HTTP_STATUS, MEDIA_TYPE } from '@shinefold/config/constants';
import { queries } from '@shinefold/db';
import { ACCOUNT_LOG } from '@web/constants/account';
import { auth } from '@web/server/auth/auth';
import { resolveTenantId } from '@web/server/tenant/resolve-tenant/resolve-tenant';
import { logger } from '@web/utils/logger/logger';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

const ACCOUNT_NOT_FOUND_MESSAGE = 'Account not found';

/** `/api` routes sit outside `proxy.ts`'s matcher, so this resolves the tenant from its own `Host` header rather than `x-tenant-id`. */
export async function GET(): Promise<NextResponse> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json(
      { message: 'Unauthorized' },
      { status: HTTP_STATUS.UNAUTHORIZED },
    );
  }

  try {
    const host = (await headers()).get('host');
    const tenantId = await resolveTenantId(host);

    if (!tenantId) {
      return NextResponse.json(
        { message: ACCOUNT_NOT_FOUND_MESSAGE },
        { status: HTTP_STATUS.NOT_FOUND },
      );
    }

    const data = await queries.account.exportAccountData(tenantId, userId);

    if (!data) {
      return NextResponse.json(
        { message: ACCOUNT_NOT_FOUND_MESSAGE },
        { status: HTTP_STATUS.NOT_FOUND },
      );
    }

    return new NextResponse(JSON.stringify(data, null, 2), {
      status: HTTP_STATUS.OK,
      headers: {
        'Content-Type': MEDIA_TYPE.JSON,
        'Content-Disposition': 'attachment; filename="account-data.json"',
      },
    });
  } catch (error) {
    logger.error(ACCOUNT_LOG.EXPORT_FAILED, { error });
    return NextResponse.json(
      { message: 'Export failed' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
