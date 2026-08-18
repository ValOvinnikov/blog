import { createLogger } from '@blog/insight';
import { isValidSignature, SIGNATURE_HEADER_NAME } from '@sanity/webhook';
import { env } from '@web/utils/env/env';
import { getRevalidateTagsForType } from '@web/utils/revalidate-tags';
import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

// `revalidateTag` requires the Node.js runtime (it isn't supported on Edge).
export const runtime = 'nodejs';

// Sent by Sanity on every webhook request automatically — not exported by
// any Sanity SDK, so this is the single source of truth for the literal.
export const SANITY_PROJECT_ID_HEADER = 'sanity-project-id';

const logger = createLogger();

interface IRevalidateWebhookBody {
  _type: string;
  _id: string;
  slug?: string;
}

function isRevalidateWebhookBody(
  value: unknown,
): value is IRevalidateWebhookBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>)['_type'] === 'string' &&
    typeof (value as Record<string, unknown>)['_id'] === 'string'
  );
}

/**
 * On-demand ISR revalidation webhook. Sanity Studio POSTs here on
 * publish/unpublish; the request is verified with `SANITY_REVALIDATE_SECRET`
 * before any cache tags are revalidated.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const secret = env.SANITY_REVALIDATE_SECRET;
  if (!secret) {
    logger.error('revalidate.secret_missing');
    return NextResponse.json(
      { message: 'Revalidation secret is not configured.' },
      { status: 500 },
    );
  }

  const signature = request.headers.get(SIGNATURE_HEADER_NAME);
  const rawBody = await request.text();

  if (!signature || !(await isValidSignature(rawBody, signature, secret))) {
    return NextResponse.json(
      { message: 'Invalid signature.' },
      { status: 401 },
    );
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { message: 'Malformed request body.' },
      { status: 400 },
    );
  }

  if (!isRevalidateWebhookBody(parsedBody)) {
    return NextResponse.json(
      { message: 'Malformed request body.' },
      { status: 400 },
    );
  }

  const { _type: type, _id: id } = parsedBody;
  const baseTags = getRevalidateTagsForType(type, id);
  // Identifies which tenant's project published. Emitting both the legacy
  // and tenant-scoped form keeps this webhook correct regardless of how many
  // service.* loaders have migrated to tenant-scoped tags yet (an unmigrated
  // loader's cache only ever holds the legacy tag; a migrated one only the
  // prefixed tag — purging both is a no-op for whichever one wasn't set).
  const tenantProjectId = request.headers.get(SANITY_PROJECT_ID_HEADER);
  const revalidated = tenantProjectId
    ? [...baseTags, ...baseTags.map((tag) => `t:${tenantProjectId}:${tag}`)]
    : baseTags;

  for (const tag of revalidated) {
    // `{ expire: 0 }` forces immediate expiration — the next request blocks
    // and renders fresh. The profile shorthand ('max' etc.) is a *stale
    // window*: it keeps serving old content while revalidating in the
    // background, which for a publish webhook means updates never appear.
    revalidateTag(tag, { expire: 0 });
  }

  // Tag expiry alone has not been invalidating prerendered route entries on
  // Vercel (#318) — pages kept serving stale content indefinitely. Purging
  // the root layout's path invalidates every page; publishes are infrequent
  // on a blog, so the whole-site blast radius is acceptable. Verified against
  // next@16.2.10 internals: every rendered route carries the implicit
  // `_N_T_/layout` tag, which `revalidatePath('/', 'layout')` expires — so
  // this covers the locale-prefixed prerenders (`/EN`) too.
  const pathPurged = revalidated.length > 0;
  if (pathPurged) {
    revalidatePath('/', 'layout');
  }

  return NextResponse.json(
    { revalidated, pathPurged, type, id },
    { status: 200 },
  );
}
