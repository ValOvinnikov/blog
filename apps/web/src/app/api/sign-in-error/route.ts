import { routes } from '@shinefold/config';
import { AUTH_QUERY_PARAM } from '@web/constants/sign-in';
import { auth } from '@web/server/auth/auth';
import { privateRedirect } from '@web/utils/private-redirect';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const session = await auth();
  const error = request.nextUrl.searchParams.get(AUTH_QUERY_PARAM.ERROR);
  const target = new URL(
    session?.user ? routes.account() : routes.home(),
    request.nextUrl.origin,
  );
  if (error) target.searchParams.set(AUTH_QUERY_PARAM.ERROR, error);

  return privateRedirect(target);
}
