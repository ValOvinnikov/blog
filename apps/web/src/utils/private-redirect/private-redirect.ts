import type { THttpStatus } from '@blog/config';
import { CACHE_CONTROL } from '@web/constants/http';
import { NextResponse } from 'next/server';

export const privateRedirect = (
  target: URL,
  status?: THttpStatus,
): NextResponse => {
  const response = NextResponse.redirect(target, status);
  response.headers.set('Cache-Control', CACHE_CONTROL.PRIVATE_NO_STORE);
  return response;
};
