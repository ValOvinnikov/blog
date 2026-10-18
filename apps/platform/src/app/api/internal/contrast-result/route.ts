import { CONTRAST_CHECK_OUTCOME } from '@blog/config/constants';
import type { TContrastResultBody } from '@blog/config/types';
import { queries } from '@blog/db';
import { hasBearerSecret } from '@platform/server/internal-api/has-bearer-secret';
import { env } from '@platform/utils/env/env';
import { logger } from '@platform/utils/logger/logger';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const contrastResultBodySchema = z.object({
  sha: z.string().regex(/^[0-9a-f]{40}$/),
  outcome: z.enum([CONTRAST_CHECK_OUTCOME.PASS, CONTRAST_CHECK_OUTCOME.FAIL]),
  failureCount: z.number().int().min(0),
  runUrl: z.string().url(),
  tag: z.string().min(1).optional(),
}) satisfies z.ZodType<TContrastResultBody>;

export async function POST(request: Request): Promise<NextResponse> {
  const secret = env.CONTRAST_RESULT_SECRET;
  if (!secret) {
    logger.error('contrast_result.secret_missing');
    return NextResponse.json(
      { message: 'Contrast result secret is not configured.' },
      { status: 500 },
    );
  }

  if (!hasBearerSecret(request, secret)) {
    return NextResponse.json(
      { message: 'Invalid or missing secret.' },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: 'Malformed contrast result body.' },
      { status: 400 },
    );
  }

  const parsed = contrastResultBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Malformed contrast result body.' },
      { status: 400 },
    );
  }

  const { sha, outcome } = parsed.data;

  try {
    await queries.findings.recordContrastResult(parsed.data);
  } catch (error) {
    logger.error('contrast_result.record_failed', { sha, outcome, error });
    return NextResponse.json(
      { message: 'Failed to record contrast result.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ sha, outcome }, { status: 200 });
}
