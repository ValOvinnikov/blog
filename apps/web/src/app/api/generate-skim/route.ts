import { createLogger } from '@blog/insight';
import { service } from '@blog/service';
import {
  generateTakeaways,
  SKIM_GENERATION_MODEL,
} from '@web/server/skim/generate-takeaways';
import { env } from '@web/utils/env/env';
import { isSecretMatch } from '@web/utils/is-secret-match';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// The Sanity write client (via `service.editorial.skim.v1.saveSkimDraft`)
// needs the Node.js runtime, same reason as `/api/revalidate`.
export const runtime = 'nodejs';

const requestBodySchema = z.object({ _id: z.string().min(1) });

const logger = createLogger();

const WRITE_CLIENT_UNCONFIGURED_MARKER = 'SANITY_API_WRITE_TOKEN is not set';

/** `saveSkimDraft`'s write client throws this exact substring when `SANITY_API_WRITE_TOKEN` is absent — the one signal this route has for "unconfigured" vs. a genuine write failure, since that env var lives in `@blog/service`, not here. */
function isWriteClientUnconfiguredError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes(WRITE_CLIENT_UNCONFIGURED_MARKER)
  );
}

/**
 * POST /api/generate-skim?secret=… — the publish-time skim-generation
 * pipeline. Sanity's publish webhook (post `_type`) calls this; it reads the
 * published post body (service read path), asks Claude for 3–7 takeaways,
 * then patches them onto the post's *draft* (service write path) for a human
 * to review and approve in Studio via publish — never the published document.
 * No AI call ever happens on the reader path.
 *
 * Secret verification matches `/api/revalidate`'s *stance*, not its exact
 * mechanism — that route verifies an HMAC signature over the body
 * (`@sanity/webhook`'s `isValidSignature`); this one has no such helper for
 * a plain shared secret, so it does its own constant-time comparison
 * (`timingSafeEqual`) against `?secret=` instead. Same outcomes either way:
 * absent config (`ANTHROPIC_API_KEY`/`SANITY_GENERATE_SECRET`) → 503,
 * feature-flag-by-absence; a missing/wrong `?secret=` → 401. A
 * `SANITY_API_WRITE_TOKEN` that isn't configured surfaces the same way
 * (503) once the write step is reached — the reader path is unaffected by
 * any of these being absent.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const { SANITY_GENERATE_SECRET: secret, ANTHROPIC_API_KEY: apiKey } = env;

  if (!secret || !apiKey) {
    logger.error('generate_skim.config_missing');
    return NextResponse.json(
      { message: 'Skim generation is not configured.' },
      { status: 503 },
    );
  }

  const providedSecret = new URL(request.url).searchParams.get('secret');
  if (!isSecretMatch(providedSecret, secret)) {
    return NextResponse.json({ message: 'Invalid secret.' }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { message: 'Malformed request body.' },
      { status: 400 },
    );
  }

  const parsedBody = requestBodySchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return NextResponse.json(
      { message: 'Malformed request body.' },
      { status: 400 },
    );
  }
  const { _id: postId } = parsedBody.data;

  const bodyResult =
    await service.editorial.skim.v1.getPublishedPostBody(postId);
  if (!bodyResult.ok) {
    logger.error('generate_skim.post_body_fetch_failed', {
      postId,
      error: bodyResult.error,
    });
    return NextResponse.json(
      { message: 'Failed to read the published post.' },
      { status: 500 },
    );
  }

  let takeaways: string[];
  try {
    takeaways = await generateTakeaways(bodyResult.data, apiKey);
  } catch (error) {
    logger.error('generate_skim.generation_failed', { postId, error });
    return NextResponse.json(
      { message: 'Failed to generate takeaways.' },
      { status: 422 },
    );
  }

  const saveResult = await service.editorial.skim.v1.saveSkimDraft({
    postId,
    takeaways,
    model: SKIM_GENERATION_MODEL,
  });
  if (!saveResult.ok) {
    logger.error('generate_skim.draft_save_failed', {
      postId,
      error: saveResult.error,
    });
    const status = isWriteClientUnconfiguredError(saveResult.error) ? 503 : 500;
    return NextResponse.json(
      { message: 'Failed to save the skim draft.' },
      { status },
    );
  }

  return NextResponse.json(
    { ok: true, count: takeaways.length },
    { status: 200 },
  );
}
