import 'server-only';

import {
  ACTION_OUTCOME,
  HTTP_STATUS,
  NEWSLETTER_SEND_NOW_REFUSAL,
} from '@shinefold/config';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const ID_MAX_LENGTH = 128;

export const studioProjectSchema = z.object({
  projectId: z.string().min(1).max(ID_MAX_LENGTH),
});

const studioPostSchema = studioProjectSchema.extend({
  postId: z.string().min(1).max(ID_MAX_LENGTH),
});

export const newsletterPostStatusQuerySchema = studioPostSchema.extend({
  isPublished: z.stringbool(),
});

export const newsletterPostSendNowBodySchema = studioPostSchema.extend({
  isPublished: z.boolean(),
});

export const readJsonBody = async (request: Request): Promise<unknown> => {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
};

export const studioForbiddenResponse = (): NextResponse =>
  NextResponse.json(
    {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: NEWSLETTER_SEND_NOW_REFUSAL.FORBIDDEN,
    },
    { status: HTTP_STATUS.FORBIDDEN },
  );

export const malformedStudioRequestResponse = (): NextResponse =>
  NextResponse.json(null, { status: HTTP_STATUS.BAD_REQUEST });
