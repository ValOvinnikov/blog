import { env } from '@web/utils/env/env';
import { isSecretMatch } from '@web/utils/is-secret-match';
import { logger } from '@web/utils/logger/logger';
import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

// `revalidateTag` requires the Node.js runtime (it isn't supported on Edge).
export const runtime = 'nodejs';

const SITE_CONFIG_CACHE_TAG = 'site-config';

/**
 * On-demand revalidation endpoint for `apps/admin`'s Look/Voice saves —
 * `@blog/db` writes there directly, with no wiring into this app's cache, so
 * without this call a save can take up to an hour to appear live (see
 * `@web/server/site-config/get-site-config`). Verified with a plain shared
 * secret (`Authorization: Bearer <SITE_CONFIG_REVALIDATE_SECRET>`), not a
 * signed payload — this is a trusted internal service-to-service call
 * between the two apps, not a public webhook.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const secret = env.SITE_CONFIG_REVALIDATE_SECRET;
  if (!secret) {
    logger.error('revalidate_site_config.secret_missing');
    return NextResponse.json(
      { message: 'Revalidation secret is not configured.' },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get('authorization');
  const providedSecret = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : null;

  if (!isSecretMatch(providedSecret, secret)) {
    return NextResponse.json(
      { message: 'Invalid or missing secret.' },
      { status: 401 },
    );
  }

  revalidateTag(SITE_CONFIG_CACHE_TAG, { expire: 0 });
  // Tag expiry alone has not been invalidating prerendered route entries on
  // Vercel (#318) — purge the root layout's path too, same fallback the
  // Sanity publish webhook (`/api/revalidate`) already relies on.
  revalidatePath('/', 'layout');

  return NextResponse.json(
    { revalidated: [SITE_CONFIG_CACHE_TAG], pathPurged: true },
    { status: 200 },
  );
}
