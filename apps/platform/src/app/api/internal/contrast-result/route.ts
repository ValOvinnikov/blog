import { CONTRAST_CHECK_OUTCOME, HTTP_STATUS } from '@blog/config/constants';
import type { TContrastResultBody } from '@blog/config/types';
import { queries } from '@blog/db';
import { CONTRAST_RESULT_LOG } from '@platform/constants/contrast-result';
import { hasBearerSecret } from '@platform/server/internal-api/has-bearer-secret';
import { env } from '@platform/utils/env/env';
import { logger } from '@platform/utils/logger/logger';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const MALFORMED_BODY_MESSAGE = 'Malformed contrast result body.';

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
    logger.error(CONTRAST_RESULT_LOG.SECRET_MISSING);
    return NextResponse.json(
      { message: 'Contrast result secret is not configured.' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }

  if (!hasBearerSecret(request, secret)) {
    return NextResponse.json(
      { message: 'Invalid or missing secret.' },
      { status: HTTP_STATUS.UNAUTHORIZED },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: MALFORMED_BODY_MESSAGE },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  }

  const parsed = contrastResultBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: MALFORMED_BODY_MESSAGE },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  }

  const { sha, outcome } = parsed.data;

  try {
    await queries.findings.recordContrastResult(parsed.data);
  } catch (error) {
    logger.error(CONTRAST_RESULT_LOG.RECORD_FAILED, { sha, outcome, error });
    return NextResponse.json(
      { message: 'Failed to record contrast result.' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }

  return NextResponse.json({ sha, outcome }, { status: HTTP_STATUS.OK });
}
