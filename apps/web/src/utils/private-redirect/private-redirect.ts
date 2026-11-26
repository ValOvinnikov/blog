import type { THttpStatus } from '@shinefold/config';
import { CACHE_CONTROL, CACHE_CONTROL_HEADER } from '@web/constants/http';
import { NextResponse } from 'next/server';

export const privateRedirect = (
  target: URL,
  status?: THttpStatus,
): NextResponse => {
  const response = NextResponse.redirect(target, status);
  response.headers.set(CACHE_CONTROL_HEADER, CACHE_CONTROL.PRIVATE_NO_STORE);
  return response;
};
