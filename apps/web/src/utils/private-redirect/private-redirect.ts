import type { THttpStatus } from '@blog/config';
import { NextResponse } from 'next/server';

export const privateRedirect = (
  target: URL,
  status?: THttpStatus,
): NextResponse => {
  const response = NextResponse.redirect(target, status);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
};
