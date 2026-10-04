import { NextResponse } from 'next/server';

export const privateRedirect = (target: URL): NextResponse => {
  const response = NextResponse.redirect(target);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
};
