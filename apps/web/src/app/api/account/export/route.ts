import { queries } from '@blog/db';
import { createLogger } from '@blog/insight';
import { auth } from '@web/server/auth/auth';
import { resolveTenantId } from '@web/server/tenant/resolve-tenant-id';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

const logger = createLogger();

/**
 * `GET /api/account/export` — the `/account` "export my data" download. A
 * plain Route Handler (not a Server Action, which can't stream a
 * `Content-Disposition` response) gated by the session cookie the browser
 * already sends, so a signed-in reader's `LinkButton` can point straight at
 * this URL with a `download` attribute.
 *
 * `/api` routes are excluded from `proxy.ts`'s matcher, so the `x-tenant-id`
 * header it threads to Server Components/Actions never reaches here — this
 * route resolves the tenant directly from its own request's `Host` header.
 */
export async function GET(): Promise<NextResponse> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const host = (await headers()).get('host');
    const tenantId = await resolveTenantId(host);

    if (!tenantId) {
      return NextResponse.json(
        { message: 'Account not found' },
        { status: 404 },
      );
    }

    const data = await queries.account.exportAccountData(tenantId, userId);

    if (!data) {
      return NextResponse.json(
        { message: 'Account not found' },
        { status: 404 },
      );
    }

    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="account-data.json"',
      },
    });
  } catch (error) {
    logger.error('account.export_failed', { error });
    return NextResponse.json({ message: 'Export failed' }, { status: 500 });
  }
}
