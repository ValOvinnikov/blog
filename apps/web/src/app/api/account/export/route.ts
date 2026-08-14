import { queries } from '@blog/db';
import { auth } from '@web/server/auth/auth';
import { getSoleTenantId } from '@web/server/site-config/get-site-config';
import { sanitizeLogMessage } from '@web/utils/sanitize-log-message';
import { NextResponse } from 'next/server';

/**
 * `GET /api/account/export` — the `/account` "export my data" download
 * (#1151/#1154, D15 §4.6/6a). The first file-download route in this app: a
 * plain Route Handler (not a Server Action, which can't stream a
 * `Content-Disposition` response) gated by the session cookie the browser
 * already sends, so a signed-in reader's `LinkButton` can point straight at
 * this URL with a `download` attribute — no client JS needed to trigger the
 * save-as prompt. Scoped to the two tables that exist today (`users`,
 * `bookmarks`) via `queries.account.exportAccountData`; comments/ratings/
 * newsletter each extend that query's own shape once they land, not this
 * route.
 */
export async function GET(): Promise<NextResponse> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tenantId = await getSoleTenantId();

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
    console.error(
      `Failed to export account data: ${sanitizeLogMessage(error)}`,
    );
    return NextResponse.json({ message: 'Export failed' }, { status: 500 });
  }
}
