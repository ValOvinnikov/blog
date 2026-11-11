import { routes } from '@blog/config';
import { privateRedirect } from '@web/utils/private-redirect';
import { toInSitePathname } from '@web/utils/to-in-site-pathname';
import { draftMode } from 'next/headers';
import type { NextRequest, NextResponse } from 'next/server';

const PATH_PARAM = 'path';

export async function GET(request: NextRequest): Promise<NextResponse> {
  (await draftMode()).disable();

  const path =
    toInSitePathname(request.nextUrl.searchParams.get(PATH_PARAM)) ??
    routes.home();
  return privateRedirect(new URL(path, request.nextUrl.origin));
}
