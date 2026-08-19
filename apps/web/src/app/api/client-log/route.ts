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
  // Vercel overwrites `x-forwarded-for` on every request it proxies and
  // does not forward an external caller's own value through, so this isn't
  // spoofable from the browser on this platform (outside an Enterprise
  // "trusted proxy" configuration this app doesn't use) — see
  // https://vercel.com/docs/edge-network/headers/request-headers#x-forwarded-for.
  const forwardedFor = request.headers.get('x-forwarded-for');
  const first = forwardedFor?.split(',')[0]?.trim();
  if (first) return first;

  return request.headers.get('x-real-ip') ?? 'unknown';
}

/**
 * Reads the request body incrementally, aborting as soon as more than
 * `maxBytes` has been read — returns `null` in that case. `Content-Length`
 * is caller-supplied and optional (a chunked-transfer request omits it
 * entirely), so the header check in `POST` below is only a cheap fast path;
 * this is what actually enforces the cap, since buffering the whole body via
 * `request.text()` first would already have done the expensive read this
 * function exists to avoid.
 */
async function readBodyWithinByteCap(
  body: ReadableStream<Uint8Array> | null,
  maxBytes: number,
): Promise<string | null> {
  if (!body) return '';

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  return Buffer.concat(chunks).toString('utf8');
}

/**
 * `POST /api/client-log` — the browser-side error reporter's
 * (`@web/utils/report-client-error`) sink: `error.tsx`/`global-error.tsx`
 * and the app's explicit client catches all report here via
 * `navigator.sendBeacon`/`fetch(..., { keepalive: true })`. This is the
 * app's first unauthenticated public write endpoint, so every layer here is
 * deliberately defensive: a strict, fixed-field Zod schema that rejects any
 * unknown key, a hard payload-size cap enforced on the stream itself (not
 * just the `Content-Length` header), an in-memory per-instance rate limiter
 * (see `isClientLogRateLimited`'s own doc comment for its cross-instance
 * limitation), and control-character sanitization on every string field
 * before it ever reaches the shared logger.
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

  const rawBody = await readBodyWithinByteCap(request.body, MAX_PAYLOAD_BYTES);
  if (rawBody === null) {
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
