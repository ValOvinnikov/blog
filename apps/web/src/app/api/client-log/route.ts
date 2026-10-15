import type { TMaybeNull } from '@blog/config';
import {
  clientLogSchema,
  sanitizeClientLogPayload,
} from '@web/server/client-log/client-log-schema/client-log-schema';
import { resolveClientKey } from '@web/server/rate-limit/client-key/client-key';
import { createRateLimiter } from '@web/server/rate-limit/rate-limiter/rate-limiter';
import { logger } from '@web/utils/logger/logger';
import { NextResponse } from 'next/server';

// Well above the capped field set, small enough that no report carries a large payload.
const MAX_PAYLOAD_BYTES = 8 * 1024;

const clientLogRateLimiter = createRateLimiter({
  name: 'client-log',
  windowMs: 60_000,
  maxRequests: 20,
});

// `Content-Length` is optional and caller-supplied, so the cap is enforced while streaming.
const readBodyWithinByteCap = async (
  body: TMaybeNull<ReadableStream<Uint8Array>>,
  maxBytes: number,
): Promise<TMaybeNull<string>> => {
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
};

// `proxy.ts`'s matcher excludes `/api/**`, so no tenant or locale resolution runs first.
export async function POST(request: Request): Promise<NextResponse> {
  const isLimited = await clientLogRateLimiter.isLimited({
    tenantKey: request.headers.get('host') ?? 'unknown',
    clientKey: resolveClientKey(request.headers),
  });
  if (isLimited) {
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
