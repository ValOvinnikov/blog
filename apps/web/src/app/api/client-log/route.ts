import { isClientLogRateLimited } from '@web/server/client-log/client-log-rate-limiter';
import {
  clientLogSchema,
  sanitizeClientLogPayload,
} from '@web/server/client-log/client-log-schema';
import { logger } from '@web/utils/logger/logger';
import { NextResponse } from 'next/server';

// ~8 KB — generous for the fixed field set (a capped message/stack/url/
// user-agent adds up to well under this), tight enough that no single
// report can carry a meaningfully large payload.
const MAX_PAYLOAD_BYTES = 8 * 1024;

function resolveClientKey(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const first = forwardedFor?.split(',')[0]?.trim();
  if (first) return first;

  return request.headers.get('x-real-ip') ?? 'unknown';
}

/**
 * `POST /api/client-log` — the browser-side error reporter's
 * (`@web/utils/report-client-error`) sink: `error.tsx`/`global-error.tsx`
 * and the app's explicit client catches all report here via
 * `navigator.sendBeacon`/`fetch(..., { keepalive: true })`. This is the
 * app's first unauthenticated public write endpoint, so every layer here is
 * deliberately defensive: a strict, fixed-field Zod schema that rejects any
 * unknown key, a hard payload-size cap, an in-memory per-instance rate
 * limiter (see `isClientLogRateLimited`'s own doc comment for its
 * cross-instance limitation), and control-character sanitization on every
 * string field before it ever reaches the shared logger.
 *
 * `proxy.ts`'s matcher excludes `/api/**`, so no tenant/locale middleware
 * runs in front of this route.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const clientKey = resolveClientKey(request);
  if (isClientLogRateLimited(clientKey)) {
    return NextResponse.json(
      { message: 'Too many requests.' },
      { status: 429 },
    );
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > MAX_PAYLOAD_BYTES) {
    return NextResponse.json(
      { message: 'Payload too large.' },
      { status: 413 },
    );
  }

  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody, 'utf8') > MAX_PAYLOAD_BYTES) {
    return NextResponse.json(
      { message: 'Payload too large.' },
      { status: 413 },
    );
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { message: 'Malformed request body.' },
      { status: 400 },
    );
  }

  const parsed = clientLogSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Malformed request body.' },
      { status: 400 },
    );
  }

  // The static event name stays fixed regardless of what the client
  // reports — the client-supplied `event` (already regex-bounded by the
  // schema) rides along as a `clientEvent` context field instead of the
  // log line's own `event`, so every report from this route groups under
  // one name downstream rather than fragmenting by client-controlled input.
  const { event: clientEvent, ...context } = sanitizeClientLogPayload(
    parsed.data,
  );
  logger.error('client_log.report_received', {
    ...context,
    clientEvent,
    source: 'client',
  });

  return new NextResponse(null, { status: 204 });
}
