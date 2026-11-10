import type { TLocaleIsoCode, TMaybeUndefined } from '@blog/config';
import { localeForPrefix } from '@web/i18n/routing';
import { NextResponse, type NextRequest } from 'next/server';

export const redirectSwitchedOffLocale = (
  request: NextRequest,
  firstSegment: string,
  liveLocales: readonly TLocaleIsoCode[],
): TMaybeUndefined<NextResponse> => {
  const prefixedLocale = localeForPrefix(firstSegment);
  if (!prefixedLocale || liveLocales.includes(prefixedLocale)) {
    return undefined;
  }

  const target = request.nextUrl.clone();
  target.pathname =
    request.nextUrl.pathname.slice(firstSegment.length + 1) || '/';
  return NextResponse.redirect(target);
};
