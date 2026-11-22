import 'server-only';

import {
  FETCH_SITE,
  MEDIA_TYPE,
  REQUEST_HEADER,
} from '@platform/constants/request';
import {
  ACTION_OUTCOME,
  HTTP_STATUS,
  NEWSLETTER_SEND_NOW_REFUSAL,
} from '@shinefold/config';
import { isNull } from '@shinefold/utils/primitives';
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

const isJsonContentType = (request: Request): boolean =>
  request.headers
    .get(REQUEST_HEADER.CONTENT_TYPE)
    ?.split(';')[0]
    ?.trim()
    .toLowerCase() === MEDIA_TYPE.JSON;

const isSameOrigin = (request: Request): boolean => {
  const origin = request.headers.get(REQUEST_HEADER.ORIGIN);
  return isNull(origin)
    ? request.headers.get(REQUEST_HEADER.SEC_FETCH_SITE) ===
        FETCH_SITE.SAME_ORIGIN
    : origin === new URL(request.url).origin;
};

// Tenant sites share the platform's registrable domain, so SameSite=Lax cookies alone do not stop their cross-origin posts.
export const isSameOriginJsonRequest = (request: Request): boolean =>
  isJsonContentType(request) && isSameOrigin(request);

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
