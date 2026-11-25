import { toRequestedPath } from '@platform/utils/requested-path/requested-path';
import { adminRoutes } from '@platform/utils/routes/routes';
import { NextResponse } from 'next/server';

export const signInRedirect = (url: URL): NextResponse =>
  NextResponse.redirect(new URL(adminRoutes.signIn(toRequestedPath(url)), url));
